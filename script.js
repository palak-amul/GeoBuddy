mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;

// Initialize dark, minimal canvas style map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', 
    center: [-15, 30], 
    zoom: 1.8,
    projection: 'globe'
});

// Configure space/horizon fog properties
map.on('style.load', () => {
    map.setFog({
        'range': [0.5, 10],
        'color': '#0b0c10',
        'high-color': '#1f2833',
        'space-color': '#000000',
        'horizon-blend': 0.03
    });
});

let pendingCoordinates = null;
let currentPlaceName = "";

// Triggered when a location is locked in (either via click or via search box)
async function handleLocationSelect(lng, lat) {
    pendingCoordinates = [lng, lat];

    map.flyTo({ center: [lng, lat], zoom: 6, speed: 1.3, essential: true });

    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        
        currentPlaceName = "Unknown Coordinates";
        if (data.features && data.features.length > 0) {
            currentPlaceName = data.features[0].place_name;
        }

        // Show inputs panel
        document.getElementById('creation-overlay').style.display = 'block';
        document.getElementById('loc-display').innerText = currentPlaceName;
        
        // Clear old inputs fields
        document.getElementById('profile-name').value = "";
        document.getElementById('profile-role').value = "";
        document.getElementById('profile-notes').value = "";
        document.getElementById('profile-name').focus();

    } catch (err) {
        console.error("Geocoding fetch failed:", err);
    }
}

// Event 1: Map click detection
map.on('click', (e) => {
    const { lng, lat } = e.lngLat;
    handleLocationSelect(lng, lat);
});

// Event 2: Search engine execution
async function executeSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            handleLocationSelect(lng, lat);
        } else {
            alert("Location not found. Try entering a broader city or country name.");
        }
    } catch (err) {
        console.error("Search query failed:", err);
    }
}

document.getElementById('search-button').addEventListener('click', executeSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

// Event 3: Commit Form and Plot Dot Marker
document.getElementById('save-button').addEventListener('click', () => {
    const name = document.getElementById('profile-name').value.trim();
    const role = document.getElementById('profile-role').value.trim();
    const notes = document.getElementById('profile-notes').value.trim();

    if (!name) {
        alert("Please enter a name to save the connection.");
        return;
    }

    // Append Node to Sidebar Feed
    const log = document.getElementById('profile-log');
    const item = document.createElement('div');
    item.className = 'profile-item';
    item.innerHTML = `
        <strong>${name}</strong>
        <span>${role || 'Connection'}</span>
        ${notes ? `<p>${notes}</p>` : ''}
        <small style="font-size: 0.7rem; color: #45a29e; display:block; margin-top:5px;">${currentPlaceName}</small>
    `;
    log.prepend(item);

    // Create Minimalist Dot DOM Node
    const dot = document.createElement('div');
    dot.className = 'dot-marker';

    // Establish Marker and Map Popup details
    const popupContent = `
        <div style="color: #0b0c10; font-family: sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 2px 0; font-size: 0.95rem;">${name}</h4>
            <p style="margin: 0 0 4px 0; font-size: 0.8rem; color: #45a29e; font-weight:600;">${role}</p>
            <p style="margin: 0; font-size: 0.75rem; color: #555;">${notes}</p>
        </div>
    `;

    new mapboxgl.Marker(dot)
        .setLngLat(pendingCoordinates)
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(popupContent))
        .addTo(map);

    // Close inputs frame
    document.getElementById('creation-overlay').style.display = 'none';
    document.getElementById('search-input').value = "";
    pendingCoordinates = null;
});