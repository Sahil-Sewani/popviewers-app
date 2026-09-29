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
        if (id) { setSurvey(data); setTitle(data.definition.titles.length === 1 ? String(data.definition.titles[0].id) : ""); }
        else setEvents(data);
      }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [reload]);
  async function open(id) {
    setBusy(true); setError("");
    try {
      const data = await request(`/event-surveys/${id}`);
      setSurvey(data); setAnswers({}); setTitle(data.definition.titles.length === 1 ? String(data.definition.titles[0].id) : "");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      await request("/event-responses", { method: "POST", body: JSON.stringify({ ...contact, version_id: survey.version_id, title_id: Number(title), answers }) });
      setDone(true);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <main className="event-workspace event-attendee">
    <header><img src={logo} alt="PopViewers" /><button onClick={onBack}>Back to home</button></header>
    {error && <p role="alert" className="event-error">{error} {!survey && <button onClick={() => setReload(reload + 1)}>Retry</button>}</p>}
    {done ? <><h1>Thank you!</h1><p>Your feedback has been received.</p></> : survey ? <>
      <h1>{survey.definition.name}</h1><p>{survey.definition.introduction}</p>
      <form onSubmit={submit}><fieldset disabled={busy}>
        <section><h2>Your details</h2>{[["first_name", "First name"], ["last_name", "Last name"], ["email", "Email"]].map(([key, label]) => <label key={key}>{label}<input required maxLength={key === "email" ? 254 : 100} type={key === "email" ? "email" : "text"} value={contact[key]} onChange={e => setContact({ ...contact, [key]: e.target.value })} /></label>)}</section>
        <label>What did you watch?<select required value={title} onChange={e => setTitle(e.target.value)}><option value="">Select a title</option>{survey.definition.titles.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select></label>
        {survey.definition.questions.map(q => <section className="event-answer" key={q.id}>
          <label htmlFor={`answer-${q.id}`}>{q.label}{q.required ? " *" : ""}</label>
          {q.kind === "multiple" ? <fieldset aria-label={q.label}>{q.options.map(option => <label className="event-check" key={option}><input type="checkbox" checked={(answers[q.id] || []).includes(option)} onChange={e => setAnswers({ ...answers, [q.id]: e.target.checked ? [...(answers[q.id] || []), option] : answers[q.id].filter(v => v !== option) })} />{option}</label>)}</fieldset>
            : q.kind === "single" ? <select id={`answer-${q.id}`} required={q.required} value={answers[q.id] ?? ""} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}><option value="">Select an answer</option>{q.options.map(o => <option key={o}>{o}</option>)}</select>
            : q.kind === "long_text" ? <textarea id={`answer-${q.id}`} required={q.required} maxLength={5000} value={answers[q.id] ?? ""} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
            : <input id={`answer-${q.id}`} required={q.required} type={q.kind === "rating" ? "number" : "text"} min={1} max={10} step={1} maxLength={5000} value={answers[q.id] ?? ""} onChange={e => setAnswers({ ...answers, [q.id]: q.kind === "rating" && e.target.value !== "" ? Number(e.target.value) : e.target.value })} />}
        </section>)}
        <button className="event-primary" disabled={busy}>{busy ? "Submitting..." : "Submit feedback"}</button>
      </fieldset></form>
    </> : <><h1>Choose your event</h1>{events === null && !error && <p role="status">Loading events...</p>}{events?.length === 0 && <p>No events are accepting feedback yet.</p>}{events?.map(e => <button className="event-choice" key={e.campaign_id} disabled={busy} onClick={() => open(e.campaign_id)}>{e.name}</button>)}</>}
  </main>;
}
