# Location Tracker

A web application that provides two features:
1. **Phone Number Lookup** - Get country, carrier, and region info for any phone number
2. **Consent-Based Location Tracking** - Generate links to request someone's GPS location (with their permission)

## Features

### Phone Number Lookup
- Enter any phone number with country code (e.g., +1234567890)
- Get information about:
  - Country and region
  - Carrier/network provider
  - Number type (Mobile, Fixed Line, VoIP, etc.)
  - Timezone

### Location Tracking
- Generate unique tracking links
- Send the link to someone
- When they click and grant permission, their GPS location is captured
- View all tracked locations on an interactive map
- Dashboard to monitor all tracking requests

## Installation

1. **Install Python 3.7+** if not already installed

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open in browser:**
   ```
   http://localhost:5000
   ```

## Usage

### Phone Lookup
1. Go to the "Phone Lookup" tab
2. Enter a phone number with country code (e.g., +14155552671)
3. Click "Lookup" to see the information

### Location Tracking
1. Go to the "Location Tracker" tab
2. Optionally enter a phone number for reference
3. Click "Generate Link" to create a tracking link
4. Send this link to the person you want to locate
5. When they click the link and allow location access, their location will be saved
6. Check the "Dashboard" tab or enter the tracking ID to view the location

## Important Notes

- **Consent Required**: The person must click the link AND grant location permission
- **Privacy**: This tool is for legitimate use only (family tracking, delivery, etc.)
- **HTTPS**: For production, use HTTPS as browsers require it for geolocation
- **Data Storage**: Currently uses in-memory storage (data is lost on restart)

## Project Structure

```
LocationTracker/
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   ├── index.html        # Main page
│   ├── track.html        # Location request page
│   ├── dashboard.html    # Admin dashboard
│   └── error.html        # Error page
└── static/
    ├── css/
    │   └── style.css     # Styles
    └── js/
        └── main.js       # Frontend JavaScript
```

## For Production Use

1. Add a database (SQLite, PostgreSQL, etc.) for persistent storage
2. Use HTTPS (required for geolocation API)
3. Add authentication for the dashboard
4. Consider rate limiting to prevent abuse
