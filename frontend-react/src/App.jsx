const { useState, useEffect, useCallback } = React;

// Point this at wherever the Flask API is running.
const API_BASE = "http://127.0.0.1:5000";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  if (h === undefined) return timeStr;
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m ?? "00"} ${period}`;
}

function emptyForm() {
  return {
    appointment_id: "",
    patient_name: "",
    doctor_name: "",
    date: "",
    time: "",
    session: "morning",
  };
}

function AppointmentCard({ appt, onDelete }) {
  return (
    <div className="appt-card">
      <div className="tab" />
      <div className="body">
        <div className="top-row">
          <span className="patient">{appt.patient_name}</span>
          <span className="time">{formatTime(appt.time)}</span>
        </div>
        <div className="meta">
          <span className="id-tag">#{appt.appointment_id}</span>
          Dr. {appt.doctor_name} · {formatDate(appt.date)}
        </div>
        <div className="bottom-row">
          <span />
          <button className="btn btn-danger-outline" onClick={() => onDelete(appt.appointment_id)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function Round({ session, title, appointments, onDelete }) {
  return (
    <div className={`round ${session}`}>
      <div className="round-header">
        <span className="dot" />
        <h2>{title}</h2>
        <span className="count">{appointments.length} booked</span>
      </div>
      <div className="card-list">
        {appointments.length === 0 && (
          <div className="empty-state">No {session} appointments yet.</div>
        )}
        {appointments.map((a) => (
          <AppointmentCard key={a.appointment_id} appt={a} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [morning, setMorning] = useState([]);
  const [evening, setEvening] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [banner, setBanner] = useState(null); // { text, error }
  const [offline, setOffline] = useState(false);

  const showBanner = (text, error = false) => {
    setBanner({ text, error });
    setTimeout(() => setBanner(null), 2600);
  };

  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setMorning(data.morning || []);
      setEvening(data.evening || []);
      setOffline(false);
    } catch (err) {
      setOffline(true);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleFieldChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSessionPick = (session) => {
    setForm((f) => ({ ...f, session }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const required = ["appointment_id", "patient_name", "doctor_name", "date", "time"];
    const missing = required.filter((f) => !form[f].trim());
    if (missing.length) {
      setFormError(`Please fill in: ${missing.join(", ").replace(/_/g, " ")}`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Could not add appointment");
        return;
      }
      showBanner(`Added ${form.patient_name}'s appointment`);
      resetForm();
      setShowForm(false);
      loadAppointments();
    } catch (err) {
      setFormError("Couldn't reach the server. Is the Flask app running?");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showBanner("Could not delete appointment", true);
        return;
      }
      showBanner("Appointment removed");
      if (searchResult && searchResult.appointment_id === id) setSearchResult(null);
      loadAppointments();
    } catch (err) {
      showBanner("Couldn't reach the server", true);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    if (!search.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/appointments/${encodeURIComponent(search.trim())}`);
      if (res.status === 404) {
        setSearchError(`No appointment found with ID "${search.trim()}"`);
        return;
      }
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError("Couldn't reach the server. Is the Flask app running?");
    }
  };

  const clearSearch = () => {
    setSearch("");
    setSearchResult(null);
    setSearchError("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand-mark">
          <span className="glyph" aria-hidden="true" />
          <div>
            <h1>Appointment Ledger</h1>
            <p className="tagline">One book, two rounds: morning and evening.</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat morning">
            <span className="num">{morning.length}</span>
            <span className="label">Morning</span>
          </div>
          <div className="stat evening">
            <span className="num">{evening.length}</span>
            <span className="label">Evening</span>
          </div>
        </div>
      </header>

      {offline && (
        <p className="offline-note">
          Can't reach the API at {API_BASE}. Start the Flask server (python app.py) and refresh.
        </p>
      )}

      <div className="toolbar">
        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Find an appointment by ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-btn" onClick={clearSearch}>
              ✕
            </button>
          )}
        </form>
        <button className="btn btn-ghost" onClick={handleSearch}>
          Search
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm((s) => !s);
            setFormError("");
          }}
        >
          {showForm ? "Cancel" : "+ New appointment"}
        </button>
      </div>

      {searchError && <p className="form-error" style={{ marginBottom: 16 }}>{searchError}</p>}

      {searchResult && (
        <div className="entry-form" style={{ marginBottom: 20 }}>
          <h2>Search result</h2>
          <AppointmentCard appt={searchResult} onDelete={handleDelete} />
        </div>
      )}

      {showForm && (
        <form className="entry-form" onSubmit={handleSubmit}>
          <h2>New appointment</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="appointment_id">Appointment ID</label>
              <input
                id="appointment_id"
                type="text"
                value={form.appointment_id}
                onChange={handleFieldChange("appointment_id")}
                placeholder="e.g. A-1042"
              />
            </div>
            <div className="field">
              <label htmlFor="patient_name">Patient name</label>
              <input
                id="patient_name"
                type="text"
                value={form.patient_name}
                onChange={handleFieldChange("patient_name")}
                placeholder="e.g. Asha Patil"
              />
            </div>
            <div className="field">
              <label htmlFor="doctor_name">Doctor</label>
              <input
                id="doctor_name"
                type="text"
                value={form.doctor_name}
                onChange={handleFieldChange("doctor_name")}
                placeholder="e.g. Rao"
              />
            </div>
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={form.date} onChange={handleFieldChange("date")} />
            </div>
            <div className="field">
              <label htmlFor="time">Time</label>
              <input id="time" type="time" value={form.time} onChange={handleFieldChange("time")} />
            </div>
            <div className="field">
              <label>Round</label>
              <div className="session-toggle">
                <button
                  type="button"
                  className={`morning ${form.session === "morning" ? "active" : ""}`}
                  onClick={() => handleSessionPick("morning")}
                >
                  ☀ Morning
                </button>
                <button
                  type="button"
                  className={`evening ${form.session === "evening" ? "active" : ""}`}
                  onClick={() => handleSessionPick("evening")}
                >
                  ☾ Evening
                </button>
              </div>
            </div>
          </div>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Clear
            </button>
            <button type="submit" className="btn btn-primary">
              Save appointment
            </button>
          </div>
        </form>
      )}

      <div className="ledger">
        <Round session="morning" title="Morning Round" appointments={morning} onDelete={handleDelete} />
        <div className="spine" aria-hidden="true" />
        <Round session="evening" title="Evening Round" appointments={evening} onDelete={handleDelete} />
      </div>

      {banner && <div className={`banner ${banner.error ? "error" : ""}`}>{banner.text}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
