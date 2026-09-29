# Event survey editor

Staff sign in and select **Manage events and questions**. Choose an existing
event or create one, edit its heading, welcome message, screening titles and
questions, then select **Publish changes**. The attendee link opens that event
directly (`?event=<campaign id>`). Join Now lists active, published events.

Questions support short text, long text, one choice, multiple choices and a
1-10 rating. Staff can change wording, choices, required status, order, add
questions, and remove questions. Contact name and email remain required.
The initial question template is generic; review it for each event before
publishing. An event must have at least one title and one question.

Edits remain in the browser until published. Leaving with unpublished edits
prompts for confirmation. Publishing is immediate for new attendees. Attendees
already answering a survey submit against the version they opened. Concurrent
publishers receive a conflict instead of silently overwriting each other.

Responses retain the question wording, title name and answers for their survey
version. The existing response dashboard includes those answers. CSV adds
`survey_version_id` and `survey_answers` (a JSON array with question IDs,
original labels and answers), alongside the existing columns. Standard
questions also populate legacy response columns. New custom questions appear
in the versioned answers. Removed questions/titles are not deleted from history.

## First deployment

This implementation requires one backend and frontend deployment. Subsequent
event edits are database writes and require no deployment.

1. Deploy the backend first using the existing workflow. Startup creates the
   new `event_survey_versions` and `event_survey_answers` tables through the
   existing `Base.metadata.create_all` mechanism. No existing table columns are
   altered. The production database user needs CREATE TABLE permission.
2. Deploy the frontend. Log in, configure and publish the current event before
   directing attendees to the new frontend. Unpublished events are not listed;
   existing hard-coded surveys are not automatically published or migrated.
   Schedule the initial switch outside an active event.
3. Verify `/health`, authenticated editing, a published event link, a test
   submission, and the versioned answer fields in the dashboard/CSV.

No CloudFormation changes or new AWS secrets are needed. Existing admin JWT
authorization protects the editor endpoints. No production deployment is
performed by these code changes themselves.

For rollback, redeploy the prior frontend/backend artifacts and retain the new
tables. The old code ignores them. Standard answers remain in `responses`;
custom answers remain preserved in the new tables for restoration of this code.

## Local verification

From `backend`, install `requirements-dev.txt` into the virtual environment,
then run `python -m unittest discover -s tests -v`. Tests use an isolated,
in-memory database and override authentication without accessing AWS.
From `frontend`, run `npm run lint` and `npm run build`.
