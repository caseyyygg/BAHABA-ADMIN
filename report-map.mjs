import { containsPoint } from './report-point.mjs';
import { map as leafletMap, geoJSON, tileLayer, circleMarker } from './map-vendor/leaflet.mjs';

let map, baseTiles, registry, selected, currentLocation, areaLayer, selectedLayer, floodLayer;
let reportPoint = null, pointMarker = null, storedPointLayer = null;
let requestNumber = 0;
let currentFeatures = [];
let currentReports = [];
let scopeBoundary = null, scopeLayer = null;
const form = document.getElementById('lgu-map-report-form');
const select = document.getElementById('lgu-map-barangay');
const message = document.getElementById('lgu-map-report-message');
const collection = (features) => ({ type: 'FeatureCollection', features });
const severityRank = { low: 1, medium: 2, high: 3 };
const colors = { low: '#16a34a', medium: '#f59e0b', high: '#dc2626' };

function syncLayers() {
  if (!map) return;
  // Static borders stay mounted while live reports refresh.
  selectedLayer.clearLayers().addData(collection(selected ? [selected] : []));
  const affected = currentFeatures.flatMap((feature) => {
    const matches = currentReports.filter((report) => report.latitude == null && !['rejected','resolved','cancelled'].includes(report.status) &&
      (report.barangay_feature_id ? String(report.barangay_feature_id) === String(feature.id) :
        report.barangay === feature.properties.name && currentFeatures.filter((item) => item.properties.name === report.barangay).length === 1));
    if (!matches.length) return [];
    const severity = matches.reduce((value, report) => severityRank[report.severity] > severityRank[value] ? report.severity : value, 'low');
    return [{ ...feature, properties: { ...feature.properties, severity } }];
  });
  floodLayer.clearLayers().addData(collection(affected));
  storedPointLayer?.clearLayers().addData(collection(currentReports.filter(report => report.latitude != null && report.longitude != null && !['rejected','resolved','cancelled'].includes(report.status)).map(report => ({type:'Feature',geometry:{type:'Point',coordinates:[Number(report.longitude),Number(report.latitude)]},properties:{severity:report.severity}}))));
}

function fitFeatures(features, maxZoom = 16) {
  if (!map || !features.length) return;
  const bounds = geoJSON(collection(features)).getBounds();
  if (bounds.isValid()) map.fitBounds(bounds, { padding: [35,35], maxZoom, animate: false });
}

function clearReportPoint() {
  reportPoint = null;
  if(pointMarker) { pointMarker.remove(); pointMarker = null; }
  document.getElementById('lgu-report-point-detail').textContent = 'Click a specific street on the map to add an exact report pin.';
}
function choosePoint(latlng) {
  if (!scopeBoundary || !containsPoint(scopeBoundary.geometry,latlng.lng,latlng.lat)) {
    clearReportPoint();
    message.textContent = 'That point is outside your assigned city or province boundary.';
    return;
  }
  const containingFeature = currentFeatures.find(item => containsPoint(item.geometry,latlng.lng,latlng.lat));
  const feature = containingFeature || selected;
  if(!feature) {
    clearReportPoint();
    message.textContent = 'This point is inside your LGU boundary, but its barangay could not be identified. Select the correct barangay, then click this street again.';
    return;
  }
  chooseBarangay(feature.id,false);
  reportPoint = {latitude:latlng.lat, longitude:latlng.lng};
  if(pointMarker) pointMarker.remove();
  pointMarker = circleMarker(latlng,{radius:8,color:'#ffffff',weight:3,fillColor:'#dc2626',fillOpacity:1,interactive:false}).addTo(map);
  document.getElementById('lgu-report-point-detail').textContent = 'Report pin: '+latlng.lat.toFixed(6)+', '+latlng.lng.toFixed(6)+' in '+feature.properties.name;
  message.textContent = containingFeature ? '' : 'Pin is inside your LGU boundary. Confirm that the manually selected barangay is correct; this point has no matching barangay polygon.';
}
const pointDetail = document.createElement('p'); pointDetail.id = 'lgu-report-point-detail'; pointDetail.className = 'view-sub'; pointDetail.setAttribute('aria-live','polite');
select.after(pointDetail);
const streetLabel = document.createElement('label'); streetLabel.textContent = 'Street or landmark (optional)'; streetLabel.htmlFor = 'lgu-map-street';
const streetInput = document.createElement('input'); streetInput.id = 'lgu-map-street'; streetInput.maxLength = 150; streetInput.placeholder = 'Name of the street or nearby landmark';
pointDetail.after(streetLabel,streetInput);
clearReportPoint();
function chooseBarangay(id, zoom = true) {
  if(String(selected?.id || '') !== String(id || '')) clearReportPoint();
  selected = currentFeatures.find((feature) => String(feature.id) === String(id)) || null;
  select.value = selected ? String(selected.id) : '';
  syncLayers();
  if (selected && zoom) fitFeatures([selected]);
}

function createMap() {
  const container = document.getElementById('lgu-report-map');
  map = leafletMap(container, { preferCanvas: false, scrollWheelZoom: true }).setView([14.6,121],10);
  map.attributionControl.setPrefix(false);
  map.on('click', (event) => choosePoint(event.latlng));
  for (const [name, order] of [['reportAreas',410],['reportFloods',420],['reportSelection',430],['reportScope',440]]) {
    map.createPane(name).style.zIndex = order;
    map.getPane(name).style.pointerEvents = 'none';
  }
  areaLayer = geoJSON(collection([]), {
    pane: 'reportAreas', interactive:false, style: { color: '#6995b8', weight: 1, fillColor: '#2478dd', fillOpacity: .07 },
    onEachFeature(feature, layer) {
      const label = document.createElement('span');
      label.textContent = feature.properties.name;
      layer.bindTooltip(label);

    },
  }).addTo(map);
  scopeLayer = geoJSON(collection([]), {pane:'reportScope',interactive:false,style:{color:'#173e77',weight:3,fill:false,dashArray:'8 5'}}).addTo(map);
  floodLayer = geoJSON(collection([]), { pane:'reportFloods', interactive:false,
    style: feature => ({ color:colors[feature.properties.severity] || colors.low, weight:2, fillOpacity:.35 }),
  }).addTo(map);
  selectedLayer = geoJSON(collection([]), { pane:'reportSelection', interactive:false,
    style:{ color:'#145cbe', weight:4, fillColor:'#2382ed', fillOpacity:.2 },
  }).addTo(map);

  storedPointLayer = geoJSON(collection([]), {pointToLayer:(feature,latlng) => circleMarker(latlng,{pane:'reportFloods',radius:7,color:'#ffffff',weight:2,fillColor:colors[feature.properties.severity] || colors.low,fillOpacity:1,interactive:false})}).addTo(map);
  const loading = document.createElement('div');
  loading.className = 'lgu-map-loading is-warning';
  loading.setAttribute('role','status');
  loading.textContent = 'Loading map details…';
  container.append(loading);
  const ready = () => { loading.hidden = true; };
  const retry = () => {
    loading.hidden = false;
    loading.replaceChildren(document.createTextNode('Map tiles are unavailable. Barangay selection still works.'));
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn btn-outline btn-sm'; button.textContent = 'Retry map';
    button.addEventListener('click', () => { loading.textContent = 'Loading map details…'; baseTiles.redraw(); });
    loading.append(button);
  };
  baseTiles = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  });
  baseTiles.on('tileload',ready).on('tileerror',retry).addTo(map);
  setTimeout(() => { if (!loading.hidden) retry(); }, 12000);
  new ResizeObserver(() => map.invalidateSize({pan:false})).observe(container);
  syncLayers();
}

window.addEventListener('bahaba-reports-map', async (event) => {
  const request = ++requestNumber;
  const { locationId, canReport, reports } = event.detail;
  form.hidden = !canReport;
  if (!locationId) return;
  try {
    registry ||= Promise.all([
      fetch('./map-data/barangays.json?v=20261009-detailed').then(response => { if (!response.ok) throw Error('Barangay boundaries unavailable.'); return response.json(); }),
      fetch('./map-data/lgu-boundaries.json?v=20261009-city-borders').then(response => { if (!response.ok) throw Error('LGU boundaries unavailable.'); return response.json(); }),
      fetch('./map-data/locations.json').then(response => { if (!response.ok) throw Error('Map locations unavailable.'); return response.json(); }),
    ]);
    const [geometry, borders, config] = await registry;
    if (request !== requestNumber) return;
    const location = config.locations.find(item => item.id === locationId);
    if (!location) throw Error('Choose a supported location.');
    scopeBoundary = borders.features.find(feature => feature.id === locationId);
    if (!scopeBoundary) throw Error('Boundary unavailable for this LGU.');
    const changed = currentLocation !== locationId;
    currentLocation = locationId;
    currentReports = reports || [];
    currentFeatures = geometry.features.filter(feature => feature.properties.city === location.map_city &&
      (!location.map_municipality || feature.properties.municipality === location.map_municipality));
    document.getElementById('lgu-report-map-scope').textContent = location.name;
    if (changed) {
      selected = null;
      clearReportPoint();
      select.replaceChildren(new Option('Select a barangay or click the map',''));
      [...currentFeatures].sort((a,b) => a.properties.name.localeCompare(b.properties.name)).forEach(feature =>
        select.add(new Option([feature.properties.name,feature.properties.municipality].filter(Boolean).join(' · '),feature.id)));
    }
    if (!map) createMap();
    if (changed) {
      areaLayer.clearLayers().addData(collection(currentFeatures));
      scopeLayer.clearLayers().addData(collection([scopeBoundary]));
    }
    syncLayers();
    requestAnimationFrame(() => {
      map.invalidateSize({pan:false});
      if (changed) fitFeatures([scopeBoundary]);
    });
  } catch (error) { registry = null; message.textContent = error.message; }
});

select.addEventListener('change', () => chooseBarangay(select.value));

let pendingReports = [];
let sendingReports = false;
const submitReports = form.querySelector('[type="submit"]');
submitReports.textContent = 'Submit queued reports';
submitReports.disabled = true;
const addReport = document.createElement('button');
addReport.type = 'button'; addReport.className = 'btn btn-outline'; addReport.textContent = 'Add report to queue';
submitReports.before(addReport);
const queue = document.createElement('div');
queue.setAttribute('aria-live', 'polite');
form.after(queue);
function renderQueue(){
  queue.replaceChildren();
  const title = document.createElement('p'); title.textContent = pendingReports.length + ' reports queued'; queue.append(title);
  pendingReports.forEach((report,index) => {
    const row = document.createElement('div'); row.style.marginBottom = '10px';
    const copy = document.createElement('span'); copy.textContent = report.barangay + ' · ' + report.severity + ': ' + report.description;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-outline btn-sm'; remove.textContent = 'Remove'; remove.disabled = sendingReports;
    remove.addEventListener('click', () => { pendingReports.splice(index,1); renderQueue(); });
    row.append(copy,remove); queue.append(row);
  });
  submitReports.disabled = sendingReports || !pendingReports.length;
  addReport.disabled = sendingReports;
}
addReport.addEventListener('click', () => {
  if(sendingReports || !form.reportValidity()) return;
  if(!selected) { message.textContent = 'Select the affected barangay first.'; return; }
  if(streetInput.value.trim() && !reportPoint) { message.textContent = 'Click the street on the map to place its report pin first.'; return; }
  const description = document.getElementById('lgu-map-description').value.trim();
  if(!description) { message.textContent = 'Describe the flooding first.'; return; }
  pendingReports.push({location_id:currentLocation, barangay_feature_id:selected.id, barangay:selected.properties.name,
    latitude:reportPoint?.latitude ?? null, longitude:reportPoint?.longitude ?? null, street_name:streetInput.value.trim(),
    severity:document.getElementById('lgu-map-severity').value, description});
  document.getElementById('lgu-map-description').value = ''; streetInput.value = ''; clearReportPoint();
  message.textContent = 'Report added. Prepare another report or submit the queue.';
  renderQueue();
});
form.noValidate = true;
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if(sendingReports || !pendingReports.length) return;
  if(document.getElementById('lgu-map-description').value.trim()) { message.textContent = 'Add your current draft to the queue before submitting.'; return; }
  sendingReports = true; renderQueue();
  let saved = 0;
  try {
    while(pendingReports.length){
      message.textContent = 'Submitting reports: ' + saved + ' saved, ' + pendingReports.length + ' remaining...';
      await window.submitLguMapReport(pendingReports[0]);
      pendingReports.shift(); saved += 1;
    }
    message.textContent = saved + ' reports submitted and saved as pending.';
  } catch(error) { message.textContent = saved + ' reports saved. ' + pendingReports.length + ' remain queued. ' + error.message; }
  finally { sendingReports = false; renderQueue(); }
});
window.addEventListener('bahaba-reports-map', (event) => {
  if(!sendingReports && (!event.detail.canReport || pendingReports.some(report => report.location_id !== event.detail.locationId))) {
    pendingReports = []; renderQueue();
  }
});
renderQueue();
window.dispatchEvent(new Event('bahaba-reports-map-ready'));
