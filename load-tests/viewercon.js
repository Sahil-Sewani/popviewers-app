import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const API_URL = __ENV.API_URL || "https://api.popviewers.com";

const successfulSubmissions = new Counter("successful_submissions");

export const options = {
  scenarios: {
    viewercon_submissions: {
      executor: "ramping-arrival-rate",

      // Begin gently.
      startRate: 1,

      // Requests started per second.
      timeUnit: "1s",

      // k6 will allocate more virtual users if requests take longer.
      preAllocatedVUs: 20,
      maxVUs: 150,

      stages: [
        // Warm-up
        { target: 2, duration: "1m" },

        // Expected event load
        { target: 5, duration: "3m" },

        // Peak load
        { target: 10, duration: "2m" },

        // Short spike
        { target: 20, duration: "1m" },

        // Recovery
        { target: 5, duration: "2m" },

        // Ramp down
        { target: 0, duration: "1m" },
      ],
    },
  },

  thresholds: {
    // Less than 1% of HTTP requests may fail.
    http_req_failed: ["rate<0.01"],

    // 95% of requests should complete in under 1 second.
    http_req_duration: ["p(95)<1000"],

    // Almost every submission should receive a valid response.
    checks: ["rate>0.99"],
  },
};

function uniqueValue() {
  return `${Date.now()}-${__VU}-${__ITER}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export default function () {
  const unique = uniqueValue();

  const payload = JSON.stringify({
    campaign_id: 1,
    title_id: 1,
    first_name: "Load",
    last_name: "Tester",
    email: `loadtest+${unique}@example.com`,
    instagram: "",
    phone: "",
    discovery_sources: "Social media, Friends & family",
    platforms: "Netflix, Hulu",
    age_group: "25–34",
    hours_per_week: "10–20",
    devices: "Phone, TV",
    genres: "Drama, Comedy",
    buzz_score: 8,
    recommend: "Yes",
    standout_elements: "Story, Acting",
    talent_interest: "Lead actor",
    social_share: "Somewhat likely",
    one_word: "Engaging",
    comments: `ViewerCon automated load test ${unique}`,
  });

  const response = http.post(`${API_URL}/responses`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    tags: {
      endpoint: "submit-response",
    },
    timeout: "10s",
  });

  const passed = check(response, {
    "submission returned 200": (res) => res.status === 200,
    "submission contains response ID": (res) => {
      if (res.status !== 200) {
        return false;
      }

      try {
        return Boolean(res.json("id"));
      } catch {
        return false;
      }
    },
  });

  if (passed) {
    successfulSubmissions.add(1);
  }

  // Represents a small pause before the virtual attendee exits.
  sleep(Math.random() * 2);
}
