import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000/appointments";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <path d="M3 21v-6h6" />
    </svg>
  );
}
function EmptyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function Ticket({ a, session }) {
  return (
    <div className={`ticket ${session}`}>
      <div className="ticket-tab" />
      <div className="ticket-body">
        <div className="ticket-id">{a.appointment_id}</div>
        <div className="ticket-name">{a.patient_name}</div>
        <div className="ticket-meta">
          Dr. {a.doctor_name} · {a.date} · <span className="ticket-time">{a.time}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <EmptyIcon />
      <div>{text}</div>
    </div>
  );
}

function Msg({ ok, text }) {
  return (
    <div className={`msg ${ok ? "ok" : "err"}`}>
      {ok ? <CheckIcon /> : <XIcon />}
      {text}
    </div>
  );
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const clock = useClock();

  const [form, setForm] = useState({
    appointment_id: "",
    patient_name: "",
    doctor_name: "",
    date: "",
    time: "",
    session: "morning",
  });
  const [addMsg, setAddMsg] = useState(null);

  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchMsg, setSearchMsg] = useState(null);

  const [morning, setMorning] = useState([]);
  const [evening, setEvening] = useState([]);
  const [loadError, setLoadError] = useState(false);

  async function loadAppointments() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMorning(data.morning);
      setEvening(data.evening);
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addAppointment() {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      setAddMsg({ text: result.message, ok: res.ok });

      if (res.ok) {
        setForm({
          appointment_id: "",
          patient_name: "",
          doctor_name: "",
          date: "",
          time: "",
          session: "morning",
        });
        loadAppointments();
      }
    } catch (e) {
      setAddMsg({ text: "Couldn't reach the server. Is the API running?", ok: false });
    }
  }

  async function searchAppointment() {
    if (!searchId.trim()) return;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(searchId.trim())}`);
      const result = await res.json();
      if (res.ok) {
        setSearchResult(result);
        setSearchMsg(null);
      } else {
        setSearchResult(null);
        setSearchMsg({ text: result.message, ok: false });
      }
    } catch (e) {
      setSearchResult(null);
      setSearchMsg({ text: "Couldn't reach the server. Is the API running?", ok: false });
    }
  }

  async function deleteAppointment() {
    if (!searchId.trim()) return;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(searchId.trim())}`, {
        method: "DELETE",
      });
      const result = await res.json();
      setSearchMsg({ text: result.message, ok: res.ok });
      setSearchResult(null);
      if (res.ok) loadAppointments();
    } catch (e) {
      setSearchMsg({ text: "Couldn't reach the server. Is the API running?", ok: false });
    }
  }

  return (
    <div className="app-root">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="#e2a53d" strokeWidth="1.5" opacity="0.6" />
              <path d="M20 10v20M10 20h20" stroke="#f2f7f5" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="20" cy="20" r="4.5" fill="#e2a53d" />
            </svg>
            <div>
              <h1>Meridian Clinic</h1>
              <div className="tagline">Appointment Scheduler</div>
            </div>
          </div>
          <div className="clock">{clock}</div>
        </div>
      </div>

      <main>
        <div className="grid-two">
          <div className="card">
            <div className="card-eyebrow">New booking</div>
            <h2>Add Appointment</h2>

            <label htmlFor="appointment_id">Appointment ID</label>
            <input
              id="appointment_id"
              name="appointment_id"
              placeholder="e.g. APT-1042"
              value={form.appointment_id}
              onChange={handleChange}
            />

            <label htmlFor="patient_name">Patient Name</label>
            <input
              id="patient_name"
              name="patient_name"
              placeholder="Full name"
              value={form.patient_name}
              onChange={handleChange}
            />

            <label htmlFor="doctor_name">Doctor Name</label>
            <input
              id="doctor_name"
              name="doctor_name"
              placeholder="Attending doctor"
              value={form.doctor_name}
              onChange={handleChange}
            />

            <div className="row-2">
              <div>
                <label htmlFor="date">Date</label>
                <input id="date" type="date" name="date" value={form.date} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="time">Time</label>
                <input id="time" type="time" name="time" value={form.time} onChange={handleChange} />
              </div>
            </div>

            <label htmlFor="session">Session</label>
            <select id="session" name="session" value={form.session} onChange={handleChange}>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>

            <div className="btn-row">
              <button className="btn-primary" onClick={addAppointment}>
                Add appointment
              </button>
            </div>
            {addMsg && (
              <div className="result-slot">
                <Msg ok={addMsg.ok} text={addMsg.text} />
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-eyebrow">Lookup</div>
            <h2>Find or Cancel</h2>
            <label htmlFor="searchId">Appointment ID</label>
            <input
              id="searchId"
              placeholder="e.g. APT-1042"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />

            <div className="btn-row">
              <button className="btn-ghost" onClick={searchAppointment}>
                Search
              </button>
              <button className="btn-danger" onClick={deleteAppointment}>
                Cancel appointment
              </button>
            </div>

            {searchResult && (
              <div className="result-slot">
                <Ticket a={searchResult} session={searchResult.session || "morning"} />
              </div>
            )}
            {searchMsg && (
              <div className="result-slot">
                <Msg ok={searchMsg.ok} text={searchMsg.text} />
              </div>
            )}
          </div>
        </div>

        <div className="card schedule-card">
          <div className="schedule-head">
            <div>
              <h2>Today's Schedule</h2>
              <div className="schedule-sub">Booked appointments, morning through evening</div>
            </div>
            <button className="refresh-btn" onClick={loadAppointments}>
              <RefreshIcon />
              Refresh
            </button>
          </div>

          <div className="horizon">
            <div className="horizon-labels">
              <span className="am">☼ Morning</span>
              <span className="pm">☾ Evening</span>
            </div>
            <div className="horizon-dot" />
          </div>

          <div className="session-columns">
            <div className="session-col morning">
              <div className="session-title morning">
                Morning <span className="session-count">{morning.length}</span>
              </div>
              {loadError ? (
                <EmptyState text="Can't load the schedule right now." />
              ) : morning.length ? (
                morning.map((a) => <Ticket key={a.appointment_id} a={a} session="morning" />)
              ) : (
                <EmptyState text="No morning appointments yet." />
              )}
            </div>
            <div className="session-col evening">
              <div className="session-title evening">
                Evening <span className="session-count">{evening.length}</span>
              </div>
              {loadError ? (
                <EmptyState text="Can't load the schedule right now." />
              ) : evening.length ? (
                evening.map((a) => <Ticket key={a.appointment_id} a={a} session="evening" />)
              ) : (
                <EmptyState text="No evening appointments yet." />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
