import { useEffect, useState } from "react";
import { API_URL } from "./config";
import logo from "./assets/logo.png";
import "./event-surveys.css";

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(response.status === 401 || response.status === 403
      ? "Your session expired. Return to the dashboard and sign in again."
      : typeof data.detail === "string" ? data.detail
      : data.detail?.map(item => item.msg).join("; ") || "Unable to save. Please try again.");
  }
  return data;
}

export function EventEditor({ token, onBack }) {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState("");
  const [document, setDocument] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newName, setNewName] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    request("/campaigns").then(data => { if (active) setEvents(data); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function selectEvent(id) {
    if (dirty && !window.confirm("Discard unpublished changes?")) return;
    setBusy(true); setError(""); setNotice(""); setDocument(null); setSelected(id); setDirty(false);
    try { if (id) setDocument(await request(`/admin/events/${id}/survey`, { token })); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function change(next) {
    setDocument({ ...document, definition: next }); setDirty(true); setNotice("");
  }
  const definition = document?.definition;
  function questionChange(index, patch) {
    change({ ...definition, questions: definition.questions.map((q, i) => i === index ? { ...q, ...patch } : q) });
  }
  async function createEvent(event) {
    event.preventDefault();
    if (dirty && !window.confirm("Discard unpublished changes?")) return;
    setBusy(true); setError("");
    try {
      const created = await request("/campaigns", { token, method: "POST", body: JSON.stringify({ name: newName.trim() }) });
      setEvents([created, ...events]); setSelected(String(created.id)); setNewName(""); setDirty(false); setNotice(""); setDocument(null);
      setDocument(await request(`/admin/events/${created.id}/survey`, { token }));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function publish(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const saved = await request(`/admin/events/${selected}/survey`, {
        token, method: "PUT", body: JSON.stringify({ base_version_id: document.version_id, definition }),
      });
      setDocument(saved); setDirty(false); setNotice("Published. New attendees will see these changes.");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="event-workspace">
    <header><img src={logo} alt="PopViewers" /><h1>Event surveys</h1>
      <button onClick={() => { if (!dirty || window.confirm("Discard unpublished changes?")) onBack(); }}>Back to responses</button></header>
    {error && <p role="alert" className="event-error">{error} <button onClick={() => { setReload(reload + 1); if (selected) selectEvent(selected); }}>Reload</button></p>}
    {notice && <p role="status" className="event-notice">{notice}</p>}
    <div className="event-toolbar">
      <label>Event<select disabled={busy} value={selected} onChange={e => selectEvent(e.target.value)}>
        <option value="">Choose an event</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}{e.active ? "" : " (closed)"}</option>)}
      </select></label>
      <form onSubmit={createEvent}><label>New event<input required maxLength={200} value={newName} onChange={e => setNewName(e.target.value)} /></label>
        <button disabled={busy || !newName.trim()}>Create event</button></form>
    </div>
    {busy && <p role="status">Saving or loading event...</p>}
    {definition && <form onSubmit={publish}>
      <fieldset disabled={busy}>
        <div className="event-toolbar"><h2>{document.version_id ? "Published survey" : "Unpublished survey"}{dirty ? " - unsaved changes" : ""}</h2>
          <button className="event-primary" type="submit">Publish changes</button></div>
        {document.version_id && <label>Attendee link<a href={`?event=${selected}`} target="_blank" rel="noreferrer">{`${window.location.origin}${window.location.pathname}?event=${selected}`}</a></label>}
        <label>Event heading<input required maxLength={200} value={definition.name} onChange={e => change({ ...definition, name: e.target.value })} /></label>
        <label>Welcome message<textarea maxLength={2000} value={definition.introduction} onChange={e => change({ ...definition, introduction: e.target.value })} /></label>
        <section><h2>Movie and screening titles</h2>
          {definition.titles.map((title, i) => <div className="event-title-row" key={i}>
            <label>Title<input required maxLength={200} value={title.name} onChange={e => change({ ...definition, titles: definition.titles.map((t, index) => i === index ? { ...t, name: e.target.value } : t) })} /></label>
            <label>Type<input maxLength={100} placeholder="Movie, series, premiere" value={title.type} onChange={e => change({ ...definition, titles: definition.titles.map((t, index) => i === index ? { ...t, type: e.target.value } : t) })} /></label>
            <button type="button" onClick={() => change({ ...definition, titles: definition.titles.filter((_, index) => i !== index) })}>Remove title</button>
          </div>)}
          <button type="button" disabled={definition.titles.length >= 50} onClick={() => change({ ...definition, titles: [...definition.titles, { id: null, name: "", type: "" }] })}>Add title</button>
        </section>
        <section><h2>Questions</h2>
          {definition.questions.map((q, i) => <article className="event-question" key={q.id}>
            <label>Question {i + 1}<input required maxLength={500} value={q.label} onChange={e => questionChange(i, { label: e.target.value })} /></label>
            <div className="event-toolbar"><label>Answer type<select value={q.kind} onChange={e => questionChange(i, { kind: e.target.value, options: ["single", "multiple"].includes(e.target.value) ? ["Yes", "No"] : [] })}>
              <option value="text">Short text</option><option value="long_text">Long text</option><option value="single">One choice</option><option value="multiple">Multiple choices</option><option value="rating">Rating (1-10)</option>
            </select></label>
              <label className="event-check"><input type="checkbox" checked={q.required} onChange={e => questionChange(i, { required: e.target.checked })} />Required</label>
              <button type="button" disabled={!i} onClick={() => { const questions = [...definition.questions]; [questions[i - 1], questions[i]] = [questions[i], questions[i - 1]]; change({ ...definition, questions }); }}>Move up</button>
              <button type="button" disabled={i === definition.questions.length - 1} onClick={() => { const questions = [...definition.questions]; [questions[i + 1], questions[i]] = [questions[i], questions[i + 1]]; change({ ...definition, questions }); }}>Move down</button>
              <button type="button" onClick={() => change({ ...definition, questions: definition.questions.filter(item => item.id !== q.id) })}>Remove question</button>
            </div>
            {["single", "multiple"].includes(q.kind) && <label>Answer choices (one per line)<textarea required value={q.options.join("\n")} onChange={e => questionChange(i, { options: e.target.value.split("\n") })} /></label>}
          </article>)}
          <button type="button" disabled={definition.questions.length >= 50} onClick={() => change({ ...definition, questions: [...definition.questions, { id: `q_${crypto.randomUUID().replaceAll("-", "")}`, label: "", kind: "text", required: false, options: [] }] })}>Add question</button>
        </section>
        <button className="event-primary" type="submit">Publish changes</button>
      </fieldset>
    </form>}
  </main>;
}

export function EventSurvey({ onBack }) {
  const [events, setEvents] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({ first_name: "", last_name: "", email: "" });
  const [title, setTitle] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("event");
    request(id ? `/event-surveys/${encodeURIComponent(id)}` : "/event-surveys")
      .then(data => {
        if (!active) return;
        setError("");
        if (id) {
          setSurvey(data);
          setTitle(data.definition.titles.length === 1 ? String(data.definition.titles[0].id) : "");
          setStep(0);
        } else if (data.length === 1) {
          // With one published event, attendees go straight into its survey.
          const onlyEvent = data[0];
          request(`/event-surveys/${onlyEvent.campaign_id}`)
            .then(eventSurvey => {
              if (!active) return;
              setSurvey(eventSurvey);
              setTitle(
                eventSurvey.definition.titles.length === 1
                  ? String(eventSurvey.definition.titles[0].id)
                  : ""
              );
              setStep(0);
            })
            .catch(e => { if (active) setError(e.message); });
        } else {
          // Zero events keeps the empty state; multiple events keep the chooser
          // as a safety fallback instead of guessing which event is intended.
          setEvents(data);
        }
      })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [reload]);

  async function open(id) {
    setBusy(true); setError("");
    try {
      const data = await request(`/event-surveys/${id}`);
      setSurvey(data); setAnswers({}); setStep(0);
      setContact({ first_name: "", last_name: "", email: "" });
      setTitle(data.definition.titles.length === 1 ? String(data.definition.titles[0].id) : "");
      window.history.replaceState({}, "", `${window.location.pathname}?event=${id}`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const questions = survey?.definition?.questions ?? [];
  // Keep the attendee experience to exactly six survey screens:
  // screen 1 = attendee details/title, screens 2-6 = dynamic question groups.
  const totalSteps = 6;
  const QUESTION_SCREEN_COUNT = 5;
  const questionGroups = Array.from({ length: QUESTION_SCREEN_COUNT }, (_, groupIndex) => {
    const startIndex = Math.floor((groupIndex * questions.length) / QUESTION_SCREEN_COUNT);
    const endIndex = Math.floor(((groupIndex + 1) * questions.length) / QUESTION_SCREEN_COUNT);
    return questions.slice(startIndex, endIndex);
  });
  const currentQuestions = step === 0 ? [] : questionGroups[step - 1];
  const progress = ((step + 1) / totalSteps) * 100;

  function missing(q) {
    const value = answers[q.id];
    return q.kind === "multiple"
      ? !Array.isArray(value) || !value.length
      : value == null || String(value).trim() === "";
  }

  function firstMissingRequired(group) {
    return group.find(q => q.required && missing(q));
  }

  function next() {
    setError("");
    if (step === 0) {
      if (!contact.first_name.trim()) return setError("Please enter your first name.");
      if (!contact.last_name.trim()) return setError("Please enter your last name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
        return setError("Please enter a valid email address.");
      }
      if (!title) return setError("Please select what you watched.");
    } else {
      const missingQuestion = firstMissingRequired(currentQuestions);
      if (missingQuestion) return setError(`Please answer: ${missingQuestion.label}`);
    }

    setStep(v => Math.min(v + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError("");
    if (step > 0) return setStep(v => v - 1);
    window.history.replaceState({}, "", window.location.pathname);
    setSurvey(null); setEvents(null); setReload(v => v + 1);
  }

  async function submit() {
    if (busy) return;
    const missingQuestion = firstMissingRequired(currentQuestions);
    if (missingQuestion) return setError(`Please answer: ${missingQuestion.label}`);

    setBusy(true); setError("");
    try {
      await request("/event-responses", {
        method: "POST",
        body: JSON.stringify({
          ...contact,
          version_id: survey.version_id,
          title_id: Number(title),
          answers,
        }),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function setAnswer(q, value) { setAnswers(a => ({ ...a, [q.id]: value })); }
  function toggle(q, option) {
    const current = Array.isArray(answers[q.id]) ? answers[q.id] : [];
    setAnswer(q, current.includes(option) ? current.filter(v => v !== option) : [...current, option]);
  }

  function questionInput(q) {
    if (q.kind === "single") return <div className="section stack">{q.options.map(o => <button type="button" key={o} className={`card-option pv-dynamic-option ${answers[q.id] === o ? "selected" : ""}`} onClick={() => setAnswer(q, o)}>{o}</button>)}</div>;
    if (q.kind === "multiple") return <><p>Select all that apply.</p><div className="section chip-wrap">{q.options.map(o => <button type="button" key={o} className={`chip pv-dynamic-chip ${(answers[q.id] || []).includes(o) ? "selected" : ""}`} onClick={() => toggle(q, o)}>{o}</button>)}</div></>;
    if (q.kind === "rating") {
      const value = answers[q.id] ?? 5;
      return <div className="section slider-wrap"><div className="mini-label">Your rating</div><div className="slider-value">{value}/10</div><input type="range" min="1" max="10" value={value} onChange={e => setAnswer(q, Number(e.target.value))}/><div className="scale-row"><span>1</span><span>10</span></div></div>;
    }
    if (q.kind === "long_text") return <div className="section textarea-card"><textarea placeholder="Share your thoughts..." maxLength={5000} value={answers[q.id] ?? ""} onChange={e => setAnswer(q, e.target.value)}/><div className="helper">Take your time — your perspective matters.</div></div>;
    return <div className="section textarea-card"><div className="input-box"><input type="text" placeholder="Type your answer..." maxLength={5000} value={answers[q.id] ?? ""} onChange={e => setAnswer(q, e.target.value)}/></div></div>;
  }

  const shell = children => <div className="app-bg"><div className="phone-shell"><div className="phone"><section className="screen">{children}</section></div></div></div>;

  if (done) return shell(<><div className="topbar"><span>PopViewers</span><span>Feedback Received</span></div><div className="section glass-card hero"><div className="eyebrow">Success</div><h1>Thank You!</h1><p>Your feedback has been securely shared with the PopViewers Audience Intelligence Platform.</p><div className="subtle-note">We appreciate you taking the time to share your perspective.</div><div className="button-row"><button className="button primary" onClick={onBack}>Finish</button></div></div></>);

  if (!survey) return shell(<><div className="topbar"><span>PopViewers</span><span>Choose Event</span></div><button className="back-link" onClick={onBack}>← Back</button><div className="logo-wrap"><img src={logo} alt="PopViewers Logo" className="logo" /></div><div className="section glass-card hero"><div className="eyebrow">PopViewers Presents</div><h1>Choose your event</h1><p>Select the screening or event you're attending.</p></div>{error && <p className="pv-survey-error">{error}</p>}{events === null && !error && <p className="subtle-note">Loading events...</p>}<div className="section stack">{events?.map(e => <button type="button" className="card-option pv-dynamic-option" key={e.campaign_id} disabled={busy} onClick={() => open(e.campaign_id)}>{e.name}</button>)}</div><div className="powered-by">Built by 9o5 Enterprises</div></>);

  return shell(<><div className="topbar"><span>Step {step + 1} of {totalSteps}</span><span>{step === 0 ? "Join the List" : "Your Take"}</span></div><div className="survey-progress"><div className="survey-progress-track"><div className="survey-progress-fill" style={{ width: `${progress}%` }}/></div><div className="survey-progress-text">{step + 1} of {totalSteps} complete</div></div><button className="back-link" onClick={back}>← Back</button>{step === 0 ? <><div className="eyebrow">PopViewers Presents</div><h1>{survey.definition.name}</h1>{survey.definition.introduction && <p>{survey.definition.introduction}</p>}<h2 className="question-heading">Join Vibes & Views</h2><p>Start with a quick check-in before sharing your feedback.</p><div className="section stack">{[["first_name","First name","text"],["last_name","Last name","text"],["email","Email address","email"]].map(([field,placeholder,type]) => <div className="input-box" key={field}><input type={type} placeholder={placeholder} value={contact[field]} onChange={e => setContact(c => ({ ...c, [field]: e.target.value }))}/></div>)}</div><div className="section"><div className="mini-label">What did you watch?</div><div className="stack">{survey.definition.titles.map(t => <button type="button" key={t.id} className={`title-option pv-dynamic-option ${title === String(t.id) ? "selected" : ""}`} onClick={() => setTitle(String(t.id))}><div className="title-meta"><div className="title-name">{t.name}</div>{t.type && <div className="title-sub">{t.type}</div>}</div>{title === String(t.id) && <div className="pill">Selected</div>}</button>)}</div></div></> : <><div className="eyebrow">{survey.definition.name}</div>{currentQuestions.map((question, index) => <div key={question.id} className={index === 0 ? "" : "pv-question-group"}><h2>{question.label}{question.required ? " *" : ""}</h2>{questionInput(question)}</div>)}</>}{error && <p role="alert" className="pv-survey-error">{error}</p>}<div className="nav-row">{step < totalSteps - 1 ? <button className="button primary" onClick={next}>Continue</button> : <button className="button primary" onClick={submit} disabled={busy}>{busy ? "Submitting..." : "Submit Feedback"}</button>}</div><div className="powered-by">Built by 9o5 Enterprises</div></>);
}
