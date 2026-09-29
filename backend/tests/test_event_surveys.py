import copy
import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app, require_admin
from app.models import Campaign, EventSurveyAnswer, SurveyResponse, Title


class EventSurveyTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        def db():
            with self.sessions() as session:
                yield session
        app.dependency_overrides[get_db] = db
        app.dependency_overrides[require_admin] = lambda: True
        self.client = TestClient(app)
        with self.sessions() as session:
            session.add(Campaign(id=1, name="Premiere", active=True))
            session.add(Campaign(id=2, name="Other event", active=True))
            session.add(Title(id=1, campaign_id=1, name="Original movie", type="Film"))
            session.add(Title(id=2, campaign_id=2, name="Other movie"))
            session.commit()
        self.definition = dict(name="Premiere", introduction="Welcome", titles=[dict(id=1, name="Original movie", type="Film")], questions=[
            dict(id="recommend", label="Recommend?", kind="single", required=True, options=["Yes", "No"]),
            dict(id="q_custom", label="What worked?", kind="multiple", required=True, options=["Story", "Music"]),
            dict(id="buzz_score", label="Your rating", kind="rating", required=True, options=[]),
        ])

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()
        self.engine.dispose()

    def publish(self, definition=None, base=None):
        return self.client.put("/admin/events/1/survey", json={"base_version_id": base, "definition": definition or self.definition})

    def payload(self, version):
        return dict(version_id=version, title_id=1, first_name="Test", last_name="Viewer", email="test@example.com",
                    answers={"recommend": "Yes", "q_custom": ["Story"], "buzz_score": 8})

    def test_auth_required_for_editor_and_publish(self):
        del app.dependency_overrides[require_admin]
        self.assertIn(self.client.get("/admin/events/1/survey").status_code, (401, 403))
        self.assertIn(self.publish().status_code, (401, 403))

    def test_publish_read_submit_and_history(self):
        self.assertEqual(self.client.get("/event-surveys").json(), [])
        result = self.publish()
        self.assertEqual(result.status_code, 200, result.text)
        first = result.json()["version_id"]
        self.assertEqual(self.client.get("/event-surveys/1").json()["version_id"], first)
        changed = copy.deepcopy(self.definition)
        changed["titles"][0]["name"] = "Updated movie"
        changed["questions"][0]["label"] = "New question wording"
        newer = self.publish(changed, first)
        self.assertEqual(newer.status_code, 200, newer.text)
        self.assertNotEqual(newer.json()["definition"]["titles"][0]["id"], 1)
        # A participant who opened the original survey can still finish it.
        submitted = self.client.post("/event-responses", json=self.payload(first))
        self.assertEqual(submitted.status_code, 201, submitted.text)
        rows = self.client.get("/responses").json()
        self.assertEqual(rows[0]["title_name"], "Original movie")
        self.assertEqual(rows[0]["survey_answers"][0]["question"], "Recommend?")
        self.assertEqual(rows[0]["survey_answers"][1]["answer"], ["Story"])
        self.assertEqual(rows[0]["buzz_score"], 8)
        with self.sessions() as session:
            self.assertEqual(session.get(Title, 1).name, "Original movie")

    def test_rejects_stale_publish_and_cross_event_titles(self):
        self.assertEqual(self.publish().status_code, 200)
        self.assertEqual(self.publish().status_code, 409)
        self.definition["titles"][0]["id"] = 2
        version = self.client.get("/event-surveys/1").json()["version_id"]
        self.assertEqual(self.publish(base=version).status_code, 422)

    def test_validates_answers_without_partial_writes(self):
        version = self.publish().json()["version_id"]
        invalid_answers = [
            {}, {"recommend": "Other", "q_custom": ["Story"], "buzz_score": 8},
            {"recommend": "Yes", "q_custom": ["Story", "Story"], "buzz_score": 8},
            {"recommend": "Yes", "q_custom": ["Story"], "buzz_score": 11},
            {"recommend": "Yes", "q_custom": ["Story"], "buzz_score": 8, "unknown": "value"},
        ]
        for answers in invalid_answers:
            payload = self.payload(version)
            payload["answers"] = answers
            self.assertEqual(self.client.post("/event-responses", json=payload).status_code, 422)
        for key, value in [("email", "invalid"), ("first_name", "  "), ("title_id", 2)]:
            payload = self.payload(version)
            payload[key] = value
            self.assertEqual(self.client.post("/event-responses", json=payload).status_code, 422)
        with self.sessions() as session:
            self.assertEqual(session.query(SurveyResponse).count(), 0)
            self.assertEqual(session.query(EventSurveyAnswer).count(), 0)

    def test_closed_event_rejects_responses(self):
        version = self.publish().json()["version_id"]
        with self.sessions() as session:
            session.get(Campaign, 1).active = False
            session.commit()
        self.assertEqual(self.client.get("/event-surveys").json(), [])
        self.assertEqual(self.client.get("/event-surveys/1").status_code, 404)
        self.assertEqual(self.client.post("/event-responses", json=self.payload(version)).status_code, 404)

    def test_invalid_question_definitions(self):
        for options in [["Only one"], ["Yes", "Yes"], [" ", "No"]]:
            changed = copy.deepcopy(self.definition)
            changed["questions"][0]["options"] = options
            self.assertEqual(self.publish(changed).status_code, 422)
        self.definition["questions"][0]["id"] = "email"
        self.assertEqual(self.publish().status_code, 422)


if __name__ == "__main__":
    unittest.main()
