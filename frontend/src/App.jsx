import "./index.css";
import logo from "./assets/logo.png";

function App() {
  return (
    <div className="app-bg">
      <div className="phone-shell">
        <div className="phone">
          <div className="dynamic-island"></div>

          <section className="screen active">
            <div className="topbar">
              <span>PopViewers</span>
              <span>Vibes & Views</span>
            </div>

            <div className="logo-wrap">
              <img
                src={logo}
                alt="PopViewers Logo"
                className="logo"
              />
            </div>

            <div className="section glass-card hero">
              <div className="eyebrow">Audience Intelligence</div>

              <h1>Join the Vibes & Views experience.</h1>

              <p>
                Scan in, share your perspective, and help shape what gets
                watched, talked about, and greenlit next.
              </p>

              <div className="button-row">
                <button className="button primary">
                  Join Now
                </button>

                <button className="button secondary">
                  Preview Flow
                </button>
              </div>

              <div className="progress">
                <div className="dot active"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>

            <div className="subtle-note">
              Designed as a fast, event-first experience: quick signup before
              the screening, richer feedback after the screening.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;