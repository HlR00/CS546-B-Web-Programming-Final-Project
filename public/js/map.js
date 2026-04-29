/* public/js/map.js — Leaflet map for NYC Roots & Flavors */

const NYC = [40.7128, -74.006];
const NYC_BOUNDS = L.latLngBounds(
  L.latLng(40.4774, -74.2591),
  L.latLng(40.9176, -73.7004)
);

const map = L.map('map', {
  center: NYC,
  zoom: 11,
  maxBounds: NYC_BOUNDS,
  maxBoundsViscosity: 0.9
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18
}).addTo(map);

const errorBox   = document.getElementById('map-error');
const listEl     = document.getElementById('business-list');
let   markerGroup = L.layerGroup().addTo(map);

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function safeText(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderMarkers(businesses) {
  markerGroup.clearLayers();
  listEl.innerHTML = '';
  listEl.setAttribute('aria-busy', 'false');

  if (!businesses.length) {
    showError('No businesses found for the selected filters.');
    return;
  }

  businesses.forEach((b) => {
    if (!b.location?.coordinates) return;
    const [lng, lat] = b.location.coordinates;

    const popup = `
      <div class="biz-popup">
        <h3>${safeText(b.name)}</h3>
        <p>${safeText(b.neighborhood || '')}</p>
        <a href="/businesses/${safeText(b._id)}">View details</a>
      </div>`;

    L.marker([lat, lng])
      .bindPopup(popup)
      .addTo(markerGroup);

    const li = document.createElement('li');
    li.innerHTML = `<a href="/businesses/${safeText(b._id)}">${safeText(b.name)}</a>`;
    listEl.appendChild(li);
  });
}

async function loadBusinesses() {
  const params = new URLSearchParams(window.location.search);
  const url = '/api/businesses?' + params.toString();

  listEl.setAttribute('aria-busy', 'true');
  errorBox.hidden = true;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderMarkers(data);
  } catch (err) {
    showError('Could not load businesses. Please try again.');
    listEl.setAttribute('aria-busy', 'false');
    console.error('[map.js]', err);
  }
}

loadBusinesses();
