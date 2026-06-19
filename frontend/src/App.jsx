import { useState } from "react";
import "./index.css";
import logo from "./assets/logo.png";

function App() {
  const [screen, setScreen] = useState("landing");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    instagram: "",
    phone: "",
    discovery_sources: [],
    platforms: [],
    age_group: "",
    hours_per_week: "",
    devices: [],
    genres: [],
    selected_title: "",
    title_id: 1,
    buzz_score: 8,
    recommend: "",
  });

  function updateField(field, value) {
    setFormData({
      ...formData,
      [field]: value,
    });
  }

  function toggleArrayField(field, value) {
    const currentValues = formData[field];

    if (currentValues.includes(value)) {
      updateField(
        field,
        currentValues.filter((item) => item !== value)
      );
    } else {
      updateField(field, [...currentValues, value]);
    }
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
          <div className="dynamic-island"></div>

          {screen === "landing" && (
            <section className="screen">
              <div className="topbar">
                <span>PopViewers</span>
                <span>Vibes & Views</span>
              </div>

              <div className="logo-wrap">
                <img src={logo} alt="PopViewers Logo" className="logo" />
              </div>

              <div className="section glass-card hero">
                <div className="eyebrow">Audience Intelligence</div>
                <h1>Join the Vibes & Views experience.</h1>
                <p>
                  Scan in, share your perspective, and help shape what gets
                  watched, talked about, and greenlit next.
                </p>

                <div className="button-row">
                  <button className="button primary" onClick={() => setScreen("signup")}>
                    Join Now
                  </button>
                  <button className="button secondary" onClick={() => setScreen("signup")}>
                    Preview Flow
                  </button>
                </div>
              </div>

              <div className="subtle-note">
                Designed as a fast, event-first experience: quick signup before
                the screening, richer feedback after the screening.
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
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={(e) => updateField("first_name", e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={(e) => updateField("last_name", e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Instagram handle (optional)"
                    value={formData.instagram}
                    onChange={(e) => updateField("instagram", e.target.value)}
                  />
                </div>

                <div className="input-box">
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("discover")}>
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
                {["Social media", "Friends & family", "Streaming homepages", "Reviews & critics"].map((item) => (
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
                <button className="button primary" onClick={() => setScreen("platforms")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "platforms" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 3 of 8</span>
                <span>Platforms</span>
              </div>

              <button className="back-link" onClick={() => setScreen("discover")}>
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
                <span>Step 4 of 8</span>
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
                      className={`choice-pill ${formData.age_group === item ? "selected" : ""}`}
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
                      className={`chip ${formData.hours_per_week === item ? "selected" : ""}`}
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
                  {["TV", "Laptop", "Phone", "Tablet", "In transit", "Audio-first"].map((item) => (
                    <div
                      key={item}
                      className={`device-card ${formData.devices.includes(item) ? "selected" : ""}`}
                      onClick={() => toggleArrayField("devices", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="mini-label">What genres pull you in?</div>
                <div className="chip-wrap">
                  {["Drama", "Comedy", "Thriller", "Romance", "Action", "Sci-Fi", "Docuseries", "Reality"].map((item) => (
                    <div
                      key={item}
                      className={`chip ${formData.genres.includes(item) ? "selected" : ""}`}
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
                <span>Step 5 of 8</span>
                <span>Event Title</span>
              </div>

              <button className="back-link" onClick={() => setScreen("profile")}>
                ← Back
              </button>

              <h2>What did you just experience?</h2>
              <p>Select the title or event experience you’re responding to.</p>

              <div className="section stack">
                {titles.map((title) => (
                  <div
                    key={title.id}
                    className={`title-option ${formData.title_id === title.id ? "selected" : ""}`}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        title_id: title.id,
                        selected_title: title.name,
                      })
                    }
                  >
                    <div className="title-meta">
                      <div className="title-name">{title.name}</div>
                      <div className="title-sub">{title.subtitle}</div>
                    </div>
                    <div className="pill">{title.tag}</div>
                  </div>
                ))}
              </div>

              <div className="nav-row">
                <button className="button primary" onClick={() => setScreen("buzz")}>
                  Continue
                </button>
              </div>
            </section>
          )}

          {screen === "buzz" && (
            <section className="screen">
              <div className="topbar">
                <span>Step 6 of 8</span>
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
                      className={`card-option ${formData.recommend === item ? "selected" : ""}`}
                      onClick={() => updateField("recommend", item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="nav-row">
                <button className="button primary">Continue</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;