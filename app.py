from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # This is crucial! It allows your HTML files to talk to this server.

# This is where i will store my bookings
DATA_FILE = 'bookings.json'

# Helper function to read bookings from the JSON file
def read_bookings():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

# Helper function to save bookings to the JSON file
def save_bookings(bookings):
    with open(DATA_FILE, 'w') as file:
        json.dump(bookings, file, indent=4)

#ROUTES

# Getting all bookings (Used by my Admin Page)
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    bookings = read_bookings()
    return jsonify(bookings)

# Creating a new booking (Used by my Main Page)
@app.route('/api/bookings', methods=['POST'])
def add_booking():
    data = request.json
    bookings = read_bookings()

    # Creating a new booking object with a unique ID
    new_booking = {
        "id": len(bookings) + 1,
        "customer_name": data.get('name'),
        "time": data.get('datetime'),
        "people": data.get('guests'),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    bookings.append(new_booking)
    save_bookings(bookings)
    
    return jsonify({"message": "Booking successful!", "id": new_booking['id']}), 201

#Deleting a booking (Used by my Admin Page "Marking as Done")
@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    bookings = read_bookings()
    # Keeping everything EXCEPT the booking i want to delete
    updated_bookings = [b for b in bookings if b['id'] != booking_id]
    
    if len(bookings) == len(updated_bookings):
        return jsonify({"message": "Booking not found"}), 404
        
    save_bookings(updated_bookings)
    return jsonify({"message": "Booking deleted"}), 200

# Receiving Food Orders (Used by my Cart "Proceed to Payment")
@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.json
    print("--- NEW ORDER RECEIVED ---")
    print(json.dumps(data, indent=2))
    # For now, we just print the order to the console (the "Kitchen Terminal")
    return jsonify({"message": "Order received by the kitchen!"}), 200

if __name__ == '__main__':
    
    app.run(debug=True, port=5000)
