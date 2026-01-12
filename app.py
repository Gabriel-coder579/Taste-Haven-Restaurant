import os
from datetime import datetime

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, 'data.db')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)


class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return { 'id': self.id, 'name': self.name, 'created_at': self.created_at.isoformat() }


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    datetime = db.Column(db.DateTime, nullable=False)
    people = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship('Client', backref=db.backref('bookings', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'client': self.client.to_dict() if self.client else None,
            'datetime': self.datetime.isoformat(),
            'people': self.people,
            'created_at': self.created_at.isoformat()
        }


@app.before_first_request
def ensure_db():
    db.create_all()


@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    dt = data.get('datetime')
    people = data.get('people')

    # Validation
    errors = []
    if not name:
        errors.append('name is required')
    if not dt:
        errors.append('datetime is required')
    if people is None:
        errors.append('people is required')
    else:
        try:
            people = int(people)
            if people < 1:
                errors.append('people must be at least 1')
        except Exception:
            errors.append('people must be an integer')

    # Parsing datetime
    booking_dt = None
    if dt:
        try:
            booking_dt = datetime.fromisoformat(dt)
        except Exception:
            try:
                booking_dt = datetime.strptime(dt, '%Y-%m-%dT%H:%M')
            except Exception:
                errors.append('datetime is invalid; use ISO format')

    if errors:
        return jsonify({ 'success': False, 'errors': errors }), 400

    # Finding or creating client (simple by name)
    client = Client.query.filter_by(name=name).first()
    if not client:
        client = Client(name=name)
        db.session.add(client)
        db.session.commit()

    booking = Booking(client_id=client.id, datetime=booking_dt, people=people)
    db.session.add(booking)
    db.session.commit()

    return jsonify({ 'success': True, 'booking': booking.to_dict() }), 201


@app.route('/api/bookings', methods=['GET'])
def list_bookings():
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bookings])


if __name__ == '__main__':
    app.run(debug=True)
