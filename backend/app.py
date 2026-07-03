from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows frontend (running on a different port) to call this API

list_morning_appointments = []
list_evening_appointments = []


class Appointment:
    def __init__(self, appointment_id, patient_name, doctor_name, date, time, session):
        self.appointment_id = appointment_id
        self.patient_name = patient_name
        self.doctor_name = doctor_name
        self.date = date
        self.time = time
        self.session = session  # "morning" or "evening"

    def to_dict(self):
        return self.__dict__


def find_appointment(appointment_id):
    """Search both lists, return (appointment, list_it_lives_in) or (None, None)."""
    for lst in (list_morning_appointments, list_evening_appointments):
        for appt in lst:
            if appt.appointment_id == appointment_id:
                return appt, lst
    return None, None


@app.route("/appointments", methods=["GET"])
def get_appointments():
    return jsonify({
        "morning": [a.to_dict() for a in list_morning_appointments],
        "evening": [a.to_dict() for a in list_evening_appointments],
    })


@app.route("/appointments", methods=["POST"])
def insert_appointment():
    data = request.json

    required = ["appointment_id", "patient_name", "doctor_name", "date", "time", "session"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"message": f"Missing fields: {', '.join(missing)}"}), 400

    existing, _ = find_appointment(data["appointment_id"])
    if existing:
        return jsonify({"message": "Appointment ID already exists"}), 409

    new_appt = Appointment(
        data["appointment_id"], data["patient_name"], data["doctor_name"],
        data["date"], data["time"], data["session"]
    )

    if new_appt.session == "morning":
        list_morning_appointments.append(new_appt)
    else:
        list_evening_appointments.append(new_appt)

    return jsonify({"message": "Appointment added", "appointment": new_appt.to_dict()}), 201


@app.route("/appointments/<appointment_id>", methods=["GET"])
def search_appointment(appointment_id):
    appt, _ = find_appointment(appointment_id)
    if appt:
        return jsonify(appt.to_dict())
    return jsonify({"message": "Not found"}), 404


@app.route("/appointments/<appointment_id>", methods=["DELETE"])
def delete_appointment(appointment_id):
    appt, lst = find_appointment(appointment_id)
    if appt:
        lst.remove(appt)
        return jsonify({"message": "Deleted"}), 200
    return jsonify({"message": "Not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)