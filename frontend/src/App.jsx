import { useState } from "react";
import "./index.css";
import logo from "./assets/logo.png";
import { API_URL } from "./config";
import {
  getAdminToken,
  saveAdminToken,
  removeAdminToken,
} from "./auth";

const initialFormData = {
  campaign_id: 1,
  first_name: "",
  last_name: "",
  email: "",
  instagram: "",
  phone: "",
  discovery_sources: [],
  attendance_reason: "",
  platforms: [],
  age_group: "",
  hours_per_week: "",
  devices: [],
  genres: [],
  selected_title: "Fightland Premiere",
  title_id: 4,
  buzz_score: 8,
  recommend: "",
  standout_elements: [],
  talent_interest: "",
  social_share: "",
  one_word: "",
  comments: "",
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) {
    return digits;
  }

  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function App() {
  const [screen, setScreen] = useState("landing");
  const [responses, setResponses] = useState([]);

  const [formData, setFormData] = useState(initialFormData);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState(getAdminToken());
  const [adminError, setAdminError] = useState("");

  function updateField(field, value) {
    setFormData({ ...formData, [field]: value });
  }

  function toggleArrayField(field, value) {
    const currentValues = formData[field];

    if (currentValues.includes(value)) {
      updateField(field, currentValues.filter((item) => item !== value));
    } else {
      updateField(field, [...currentValues, value]);
    }
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    if (!formData.first_name.trim()) {
      alert("Please enter your first name.");
      setScreen("signup");
      return;
    }

    if (!formData.last_name.trim()) {
      alert("Please enter your last name.");
      setScreen("signup");
      return;
    }

    if (!formData.email.trim()) {
      alert("Please enter your email address.");
      setScreen("signup");
      return;
    }

    if (!isValidEmail(formData.email)) {
      alert("Please enter a valid email address, such as name@example.com.");
      setScreen("signup");
      return;
    }

    if (!formData.title_id) {
      alert("Please select the event or title.");
      return;
    }

    if (!formData.recommend) {
      alert("Please tell us whether you would recommend this title.");
      return;
    }

    if (!formData.one_word.trim()) {
      alert("Please enter one word describing your experience.");
      return;
    }

    setIsSubmitting(true);

    const normalizedPhone = formData.phone.replace(/\D/g, "");

    const payload = {
      ...formData,
      phone: normalizedPhone,
      discovery_sources: formData.discovery_sources.join(", "),
      platforms: formData.platforms.join(", "),
      devices: formData.devices.join(", "),
      genres: formData.genres.join(", "),
      standout_elements: formData.standout_elements.join(", "),
    };

    try {
      const response = await fetch(`${API_URL}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Unable to submit feedback. Please check your answers.";

        try {
          const errorData = await response.json();

          if (response.status === 422 && Array.isArray(errorData.detail)) {
            message =
              errorData.detail[0]?.msg ||
              "Please check that all required information is valid.";
          } else if (typeof errorData.detail === "string") {
            message = errorData.detail;
          }
        } catch {
          // Keep the default message if the API response is not JSON.
        }

        throw new Error(message);
      }

      setScreen("thankyou");
    } catch (error) {
      console.error(error);
      alert(error.message || "Unable to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdminLogin() {
  setAdminError("");

  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    if (!response.ok) {
      throw new Error("Invalid username or password");
    }

    const data = await response.json();

    saveAdminToken(data.access_token);
    setAdminToken(data.access_token);
    setAdminPassword("");

    await loadAdminResponses(data.access_token);
  } catch (error) {
    console.error(error);
    setAdminError("Invalid username or password.");
  }
}

async function loadAdminResponses(token = adminToken) {
  if (!token) {
    setScreen("adminLogin");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/responses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load responses");
    }

    const data = await response.json();

    setResponses(data);
    setScreen("admin");
    setAdminError("");
  } catch (error) {
    console.error(error);

    removeAdminToken();
    setAdminToken("");
    setScreen("adminLogin");
    setAdminError("Please log in again.");
  }
}

  function exportResponsesCsv() {
    const headers = [
      "id",
      "campaign_id",
      "campaign_name",
      "title_id",
      "title_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "instagram",
      "discovery_sources",
      "attendance_reason",
      "platforms",
      "age_group",
      "hours_per_week",
      "devices",
      "genres",
      "buzz_score",
      "recommend",
      "standout_elements",
      "talent_interest",
      "social_share",
      "one_word",
      "comments",
      "created_at",
    ];

    const rows = responses.map((response) => [
      response.id ?? "",
      response.campaign_id ?? "",
      response.campaign_name ?? "",
      response.title_id ?? "",
      response.title_name ?? "",
      response.first_name ?? "",
      response.last_name ?? "",
      response.email ?? "",
      response.phone ?? "",
      response.instagram ?? "",
      response.discovery_sources ?? "",
      response.attendance_reason ?? "",
      response.platforms ?? "",
      response.age_group ?? "",
      response.hours_per_week ?? "",
      response.devices ?? "",
      response.genres ?? "",
      response.buzz_score ?? "",
      response.recommend ?? "",
      response.standout_elements ?? "",
      response.talent_interest ?? "",
      response.social_share ?? "",
      response.one_word ?? "",
      response.comments ?? "",
      response.created_at ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "popviewers-responses.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const titles = [
    {
      id: 1,
      name: "Vibes & Views Premiere Screening",
      subtitle: "Hosted event · Audience feedback session",
      tag: "Tonight",
    },
    {
      id: 2,
      name: "Featured Film Experience",
      subtitle: "Special screening · curated audience",
      tag: "Curated",
    },
    {
      id: 3,
      name: "New Series Pilot Preview",
      subtitle: "Early-access audience preview",
      tag: "Preview",
    },
  ];

  return (
    <div className="app-bg">
      <div className="phone-shell">
        <div className="phone">

          {screen === "landing" && (
            <section className="screen">
              <div className="topbar">
                <span>PopViewers</span>
                <button 
                  className="back-link"
                  onClick={() => {
                    if (adminToken) {
                      loadAdminResponses(adminToken);
                    } else {
                      setScreen("adminLogin");
                    }
                  }}
                >
                  Staff Login
                </button>
                </div>

                <div className="logo-wrap">
                  <img src={logo} alt="PopViewers Logo" className="logo" />
                </div>

                <div className="section glass-card hero">
                  <div className="eyebrow">PopViewers Presents</div>

                  <h1>Welcome to ViewerCon</h1>

                  <p>
                    We're excited to have you here! Share your thoughts on today's screening and
                    help shape the future of entertainment through audience insights.
                  </p>

                  <div className="button-row">
                    <button
                      className="button primary"
                      onClick={() => setScreen("signup")}
                    >
                      Join Now
                    </button>
                  </div>
                </div>

                <div className="subtle-note">
                  Thank you for taking a few minutes to share your feedback.
                </div>
                </section>
                )}

                {screen === "signup" && (
                  <section className="screen">
                    <div className="topbar">
                      <span>Step 1 of 8</span>
                      <span>Join the List</span>
                    </div>

                    <button className="back-link" onClick={() => setScreen("landing")}>
                      ← Back
                    </button>

              <h2>Join Vibes & Views</h2>
              <p>
                Start with a quick check-in so PopViewers can keep you in the
                loop on future screenings and drops.
              </p>

              <div className="section stack">
                {[
                  ["first_name", "First name", "text"],
                  ["last_name", "Last name", "text"],
                  ["email", "Email address", "email"],
                  ["instagram", "Instagram handle (optional)", "text"],
                  ["phone", "Phone number (optional)", "tel"],
                ].map(([field, placeholder, type]) => (
                  <div className="input-box" key={field}>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[field]}
                      onChange={(e) => {
                        const value =
                          field === "phone"
                            ? formatPhoneNumber(e.target.value)
                            : e.target.value;

                        updateField(field, value);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="nav-row">
                <button
                  className="button primary"
                  onClick={() => {
                    if (!formData.first_name.trim()) {
                      alert("Please enter your first name.");
                      return;
                    }

                    if (!formData.last_name.trim()) {
                      alert("Please enter your last name.");
                      return;
                    }

                    if (!formData.email.trim()) {
                      alert("Please enter your email address.");
                      return;
                    }

                    if (!isValidEmail(formData.email)) {
                      alert("Please enter a valid email address, such as name@example.com.");
                      return;
                    }

                    setScreen("discover");
                  }}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "discover" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 2 of 8</span>
                <span>Discovery Style</span>
              </div>

              <button className="back-link" onClick={() => setScreen("signup")}>
                ← Back
              </button>

              <h2>How do you usually decide what to watch?</h2>
              <p>Pick the sources that influence you most.</p>

              <div className="section stack">
                {[
                  "Social media",
                  "Friends & family",
                  "Streaming homepages",
                  "Reviews & critics",
                ].map((item) => (
                  <div
                    key={item}
                    className={`card-option ${
                      formData.discovery_sources.includes(item) ? "selected" : ""
                    }`}
                    onClick={() => toggleArrayField("discovery_sources", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="nav-row">
                <button
                  className="button primary"
                  onClick={() => setScreen("attendanceReason")}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "attendanceReason" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 3 of 9</span>
                <span>Why You're Here</span>
              </div>

              <button
                className="back-link"
                onClick={() => setScreen("discover")}
              >
                ← Back
              </button>

              <h2>What brought you here tonight?</h2>
              <p>
                What was the biggest reason you decided to attend today's Fightland
                premiere?
              </p>

              <div className="section stack">
                {[
                  "50 Cent",
                  "The official trailer",
                  "The cast",
                  "The story or premise",
                  "ViewerCon",
                  "Recommendation from a friend or family member",
                  "Social media",
                  "I was curious",
                  "Other",
                ].map((item) => (
                  <div
                    key={item}
                    className={`card-option ${
                      formData.attendance_reason === item ? "selected" : ""
                    }`}
                    onClick={() => updateField("attendance_reason", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="nav-row">
                <button
                  className="button primary"
                  onClick={() => {
                    if (!formData.attendance_reason) {
                      alert("Please select what brought you here tonight.");
                      return;
                    }

                    setScreen("platforms");
                  }}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "platforms" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 4 of 9</span>
                <span>Platforms</span>
              </div>

              <button
                className="back-link"
                onClick={() => setScreen("attendanceReason")}
              >
                ← Back
              </button>

              <h2>Which platforms do you use most?</h2>
              <p>Select all that apply.</p>

              <div className="section grid-3">
                {[
                  "Netflix",
                  "Hulu",
                  "Prime Video",
                  "Disney+",
                  "Max",
                  "Apple TV+",
                  "Paramount+",
                  "Peacock",
                  "Audible",
                ].map((item) => (
                  <div
                    key={item}
                    className={`streaming-badge ${
                      formData.platforms.includes(item) ? "selected" : ""
                    }`}
                    onClick={() => toggleArrayField("platforms", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("profile")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "profile" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 5 of 9</span>
                <span>Audience Profile</span>
              </div>

              <button className="back-link" onClick={() => setScreen("platforms")}>
                ← Back
              </button>

              <h2>Tell us a little about your viewing style.</h2>
              <p>This helps PopViewers understand audience patterns, not just opinions.</p>

              <div className="section">
                <div className="mini-label">Age range</div>
                <div className="grid-2">
                  {["18–24", "25–34", "35–44", "45+"].map((item) => (
                    <div
                      key={item}
                      className={`choice-pill ${
                        formData.age_group === item ? "selected" : ""
                      }`}
                      onClick={() => updateField("age_group", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="mini-label">Hours watched or listened per week</div>
                <div className="chip-wrap">
                  {["Less than 5", "5–10", "10–20", "20+"].map((item) => (
                    <div
                      key={item}
                      className={`chip ${
                        formData.hours_per_week === item ? "selected" : ""
                      }`}
                      onClick={() => updateField("hours_per_week", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="mini-label">Where do you usually watch or listen?</div>
                <div className="grid-3">
                  {["TV", "Laptop", "Phone", "Tablet", "In transit", "Audio-first"].map(
                    (item) => (
                      <div
                        key={item}
                        className={`device-card ${
                          formData.devices.includes(item) ? "selected" : ""
                        }`}
                        onClick={() => toggleArrayField("devices", item)}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="section">
                <div className="mini-label">What genres pull you in?</div>
                <div className="chip-wrap">
                  {[
                    "Drama",
                    "Comedy",
                    "Thriller",
                    "Romance",
                    "Action",
                    "Sci-Fi",
                    "Docuseries",
                    "Reality",
                  ].map((item) => (
                    <div
                      key={item}
                      className={`chip ${
                        formData.genres.includes(item) ? "selected" : ""
                      }`}
                      onClick={() => toggleArrayField("genres", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("title")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "title" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 6 of 9</span>
                <span>Fightland</span>
              </div>

              <button className="back-link" onClick={() => setScreen("profile")}>
                ← Back
              </button>

              <h2>You’re reviewing Fightland</h2>
              <p>Confirm the screening you just attended.</p>

              <div className="section stack">
                <div className="title-option selected">
                  <div className="title-meta">
                    <div className="title-name">Fightland Premiere</div>
                    <div className="title-sub">
                      STARZ Original · ViewerCon Screening
                    </div>
                  </div>

                  <div className="pill">Tonight</div>
                </div>
              </div>

              <div className="nav-row">
                <button
                  className="button primary"
                  onClick={() => setScreen("buzz")}
                >
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "buzz" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 7 of 9</span>
                <span>Reaction Signal</span>
              </div>

              <button className="back-link" onClick={() => setScreen("title")}>
                ← Back
              </button>

              <h2>How excited are you about this title?</h2>
              <p>Give us your immediate reaction while it’s fresh.</p>

              <div className="section slider-wrap">
                <div className="mini-label">Buzz Score</div>
                <div className="slider-value">{formData.buzz_score}/10</div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.buzz_score}
                  onChange={(e) => updateField("buzz_score", Number(e.target.value))}
                />

                <div className="scale-row">
                  <span>Low buzz</span>
                  <span>Can’t wait</span>
                </div>
              </div>

              <div className="section">
                <div className="mini-label">Would you recommend it?</div>
                <div className="stack">
                  {["Yes", "Not sure", "No"].map((item) => (
                    <div
                      key={item}
                      className={`card-option ${
                        formData.recommend === item ? "selected" : ""
                      }`}
                      onClick={() => updateField("recommend", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("standout")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "standout" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 8 of 9</span>
                <span>What Landed</span>
              </div>

              <button className="back-link" onClick={() => setScreen("buzz")}>
                ← Back
              </button>

              <h2>What stood out most?</h2>
              <p>Select the elements that had the biggest impact.</p>

              <div className="section chip-wrap">
                {[
                  "Story",
                  "Acting",
                  "Characters",
                  "Ending",
                  "Visuals",
                  "Humor",
                  "Action",
                  "Emotional impact",
                  "Music / sound",
                ].map((item) => (
                  <div
                    key={item}
                    className={`chip ${
                      formData.standout_elements.includes(item) ? "selected" : ""
                    }`}
                    onClick={() => toggleArrayField("standout_elements", item)}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="section">
                <div className="mini-label">Whose involvement excites you most?</div>
                <div className="grid-2">
                  {["Lead actor", "Creator / showrunner", "Director", "Host / curator"].map(
                    (item) => (
                      <div
                        key={item}
                        className={`choice-pill ${
                          formData.talent_interest === item ? "selected" : ""
                        }`}
                        onClick={() => updateField("talent_interest", item)}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="section">
                <div className="mini-label">How likely are you to post about it?</div>
                <div className="stack">
                  {["Very likely", "Somewhat likely", "Not likely"].map((item) => (
                    <div
                      key={item}
                      className={`card-option ${
                        formData.social_share === item ? "selected" : ""
                      }`}
                      onClick={() => updateField("social_share", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("final")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "final" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 9 of 9</span>
                <span>Final Take</span>
              </div>

              <button className="back-link" onClick={() => setScreen("standout")}>
                ← Back
              </button>

              <h2>Give us your final take.</h2>
              <p>Short, memorable, and honest.</p>

              <div className="section textarea-card">
                <div className="mini-label">One word to describe it</div>
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="ex: electric, fresh, addictive"
                    value={formData.one_word}
                    onChange={(e) => updateField("one_word", e.target.value)}
                  />
                </div>
              </div>

              <div className="section textarea-card">
                <div className="mini-label">Anything else we should know?</div>
                <textarea
                  placeholder="Share a final thought about what worked, what didn’t, or what made the experience memorable."
                  value={formData.comments}
                  onChange={(e) => updateField("comments", e.target.value)}
                />
                <div className="helper">
                  Optional — this is where the most quotable audience insight often shows up.
                </div>
              </div>

              <div className="nav-row">
                <button
                  className="button primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </section>
          )}

          {screen === "thankyou" && (
            <section className="screen">
              <div className="topbar">
                <span>PopViewers</span>
                <span>Feedback Received</span>
              </div>

              <div className="section glass-card hero">
                <div className="eyebrow">Success</div>
                <h1>Thank You!</h1>
                <p>
                  Your feedback has been submitted successfully and will help
                  shape future screenings, releases, and audience experiences.
                </p>

                <div className="subtle-note">
                  We appreciate you taking the time to share your perspective.
                </div>

                <div className="button-row">
                <button
                  className="button primary"
                  onClick={() => {
                    setFormData(initialFormData);
                    setScreen("landing");
                  }}
                >
                  Finish
                </button>
                </div>
              </div>
            </section>
          )}

          {screen === "adminLogin" && (
            <section className="screen">
              <div className="topbar">
                <span>PopViewers</span>
                <span>Admin Login</span>
              </div>

              <button
                className="back-link"
                onClick={() => {
                  setAdminError("");
                  setScreen("landing");
                }}
              >
                ← Back
              </button>

              <h2>Admin Access</h2>
              <p>Enter your credentials to view survey responses.</p>

              <div className="section stack">
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Username"
                    value={adminUsername}
                    onChange={(event) => setAdminUsername(event.target.value)}
                  />
                </div>

                <div className="input-box">
                  <input
                    type="password"
                    placeholder="Password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAdminLogin();
                      }
                    }}
                  />
                </div>

                {adminError && <p>{adminError}</p>}
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={handleAdminLogin}>
                  Log In
                </button>
              </div>
            </section>
          )}

          {screen === "admin" && (
            <section className="screen">
              <div className="topbar">
                <span>PopViewers</span>
                <span>Admin</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <button className="back-link" onClick={() => setScreen("landing")}>
                  ← Back
                </button>

                <button
                  className="back-link"
                  onClick={() => {
                    removeAdminToken();
                    setAdminToken("");
                    setAdminUsername("");
                    setAdminPassword("");
                    setResponses([]);
                    setScreen("landing");
                  }}
                >
                  Log Out
                </button>
              </div>

              <h2>Responses</h2>

              <div className="nav-row">
                <button
                  className="button secondary"
                  onClick={exportResponsesCsv}
                  disabled={responses.length === 0}
                >
                  Export CSV
                </button>
              </div>

              <div className="section textarea-card">
                <div className="mini-label">Admin Summary</div>

                <p>
                  <strong>Total Responses:</strong> {responses.length}
                </p>

                <p>
                  <strong>Average Buzz:</strong>{" "}
                  {responses.length === 0
                    ? "N/A"
                    : (
                        responses.reduce(
                          (sum, response) => sum + (response.buzz_score || 0),
                          0
                        ) / responses.length
                      ).toFixed(1)}
                  /10
                </p>

                <p>
                  <strong>Recommend Rate:</strong>{" "}
                  {responses.length === 0
                    ? "N/A"
                    : `${Math.round(
                        (responses.filter(
                          (response) =>
                            (response.recommend || "").toLowerCase() === "yes"
                        ).length /
                          responses.length) *
                          100
                      )}%`}
                </p>
              </div>

              {responses.map((response) => (
                <div key={response.id} className="section textarea-card">
                  <strong>
                    {response.first_name} {response.last_name}
                  </strong>

                  <p>{response.email}</p>

                  <p>
                    <strong>Buzz:</strong> {response.buzz_score}/10
                  </p>

                  <p>
                    <strong>One Word:</strong> {response.one_word}
                  </p>

                  <p>
                    <strong>Comments:</strong> {response.comments}
                  </p>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;