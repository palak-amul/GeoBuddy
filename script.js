mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;

// Crank up a vibrant, stylized Mapbox globe
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/navigation-night-v1', // Bright neon lines on dark canvas
    center: [-20, 25], 
    zoom: 2,
    projection: 'globe'
});

// Give space a deep purple/neon glow aesthetic
map.on('style.load', () => {
    map.setFog({
        'range': [0.5, 8],
        'color': '#130f26',
        'high-color': '#0a0813',
        'space-color': '#030206',
        'horizon-blend': 0.08
    });
});

let totalSquadCount = 0;
let pendingCoordinates = null;
let currentPlaceName = "";

// 1. Listen for User Click to Open Creator Tool
map.on('click', async (e) => {
    const { lng, lat } = e.lngLat;
    pendingCoordinates = [lng, lat];

    // Smooth hyper-dive camera animation
    map.flyTo({ center: [lng, lat], zoom: 4.5, speed: 1.4, essential: true });

    // Look up where on Earth they clicked
    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        
        currentPlaceName = "International Waters 🌊";
        if (data.features && data.features.length > 0) {
            currentPlaceName = data.features[0].place_name;
        }

        // Pop open the neon Creation UI
        const overlay = document.getElementById('creation-overlay');
        overlay.style.display = 'block';
        document.getElementById('loc-display').innerText = `📍 ${currentPlaceName}`;
        
        // Reset name box and focus on it automatically
        document.getElementById('friend-name').value = "";
        document.getElementById('friend-name').focus();

    } catch (err) {
        console.error("Geocoding failed:", err);
    }
});

// 2. Handle Locking In a Friend!
document.getElementById('spawn-button').addEventListener('click', () => {
    const nameInput = document.getElementById('friend-name').value.trim();
    const emojiSelect = document.getElementById('friend-emoji').value;

    // Don't add blank names!
    if (!nameInput) {
        alert("Give your crew member a name first! 🔥");
        return;
    }

    // Update Game Score
    totalSquadCount++;
    document.getElementById('friend-count').innerText = totalSquadCount;

    // Add to Sidebar Log Feed
    const log = document.getElementById('friend-log');
    const item = document.createElement('div');
    item.className = 'friend-list-item';
    item.innerHTML = `<strong>${emojiSelect} ${nameInput}</strong><br><span style="font-size:0.75rem; color:#00ffff;">${currentPlaceName}</span>`;
    log.prepend(item);

    // Create a Custom Emoji DOM Element for the Map Marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = emojiSelect;

    // Drop the custom emoji pin directly onto the globe coordinates
    new mapboxgl.Marker(el)
        .setLngLat(pendingCoordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3 style="color:#000; margin:0;">${nameInput} is here!</h3>`))
        .addTo(map);

    // Hide the creation pop-up panel till next click
    document.getElementById('creation-overlay').style.display = 'none';
    pendingCoordinates = null;
});