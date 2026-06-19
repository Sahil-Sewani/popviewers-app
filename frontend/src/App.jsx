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