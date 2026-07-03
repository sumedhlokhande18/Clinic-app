import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000/appointments";

function AppointmentCard({ a }) {
  return (
    <div className="appt">
      <strong>{a.appointment_id}</strong> — {a.patient_name}
      <br />
      Doctor: {a.doctor_name} | {a.date} at {a.time}
    </div>
  );
}

export default function App() {
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

  async function loadAppointments() {
    const res = await fetch(API);
    const data = await res.json();
    setMorning(data.morning);
    setEvening(data.evening);
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function addAppointment() {
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
  }

  async function searchAppointment() {
    if (!searchId.trim()) return;
    const res = await fetch(`${API}/${encodeURIComponent(searchId.trim())}`);
    const result = await res.json();

    if (res.ok) {
      setSearchResult(result);
      setSearchMsg(null);
    } else {
      setSearchResult(null);
      setSearchMsg({ text: result.message, ok: false });
    }
  }

  async function deleteAppointment() {
    if (!searchId.trim()) return;
    const res = await fetch(`${API}/${encodeURIComponent(searchId.trim())}`, {
      method: "DELETE",
    });
    const result = await res.json();
    setSearchMsg({ text: result.message, ok: res.ok });
    setSearchResult(null);
    if (res.ok) loadAppointments();
  }

  return (
    <div className="container">
      <h1>Clinic Appointment Scheduler</h1>

      <div className="card">
        <h2>Add Appointment</h2>
        <input
          name="appointment_id"
          placeholder="Appointment ID"
          value={form.appointment_id}
          onChange={handleChange}
        />
        <input
          name="patient_name"
          placeholder="Patient Name"
          value={form.patient_name}
          onChange={handleChange}
        />
        <input
          name="doctor_name"
          placeholder="Doctor Name"
          value={form.doctor_name}
          onChange={handleChange}
        />
        <input type="date" name="date" value={form.date} onChange={handleChange} />
        <input type="time" name="time" value={form.time} onChange={handleChange} />
        <select name="session" value={form.session} onChange={handleChange}>
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
        </select>
        <button onClick={addAppointment}>Add Appointment</button>
        {addMsg && (
          <div className={`msg ${addMsg.ok ? "ok" : "err"}`}>{addMsg.text}</div>
        )}
      </div>

      <div className="card">
        <h2>Search / Delete by Appointment ID</h2>
        <input
          placeholder="Appointment ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <button onClick={searchAppointment}>Search</button>
        <button className="danger" onClick={deleteAppointment}>
          Delete
        </button>
        {searchResult && <AppointmentCard a={searchResult} />}
        {searchMsg && (
          <div className={`msg ${searchMsg.ok ? "ok" : "err"}`}>{searchMsg.text}</div>
        )}
      </div>

      <div className="card">
        <h2>All Appointments</h2>
        <button onClick={loadAppointments}>Refresh</button>

        <div className="session-block">
          <h3>Morning</h3>
          {morning.length ? (
            morning.map((a) => <AppointmentCard key={a.appointment_id} a={a} />)
          ) : (
            <p>No morning appointments.</p>
          )}
        </div>

        <div className="session-block">
          <h3>Evening</h3>
          {evening.length ? (
            evening.map((a) => <AppointmentCard key={a.appointment_id} a={a} />)
          ) : (
            <p>No evening appointments.</p>
          )}
        </div>
      </div>
    </div>
  );
}