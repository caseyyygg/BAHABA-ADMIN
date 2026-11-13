const originalTime = value => {
  if (!value) return NaN;
  const text = String(value).trim().replace(' ', 'T');
  return Date.parse(/[zZ]$|[+-]\d{2}:\d{2}$/.test(text) ? text : text + 'Z');
};
const normalize = value => String(value || '').normalize('NFKC').trim().toLowerCase();
const mentions = (text, name) => {
  const escaped = normalize(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped && new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'u').test(normalize(text));
};

export function provisionalBarangaySignals(events, boundaries, now = Date.now()) {
  const groups = new Map(), seen = new Set();
  for (const event of events) {
    const published = originalTime(event.published_at);
    if (normalize(event.classification) !== 'flood' || !Number.isFinite(published) || published > now || published < now - 86400000) continue;
    const id = String(event.source_post_id || event.post_url || event.id || '');
    const identity = normalize(event.source) + ':' + id;
    if (!id || seen.has(identity)) continue;
    seen.add(identity);
    const matches = boundaries.filter(feature => {
      const names = [feature.properties?.name, feature.properties?.sourceName].filter(Boolean);
      return names.some(name => normalize(event.barangay).replace(/^(?:barangay|brgy\.?)\s+/u, '') === normalize(name) || mentions(event.post_text, name));
    });
    // Identically named boundaries must not be assigned an invented location.
    for (const boundary of matches) {
      if (matches.some(other => String(other.id) !== String(boundary.id) && normalize(other.properties?.name) === normalize(boundary.properties?.name))) continue;
      const key = String(boundary.id);
      const pin = groups.get(key) || { event_id:null, location_key:'provisional:' + key, barangay_feature_id:key, label:boundary.properties.name, precision_level:'barangay', phase:'MONITORING', verification_status:'reported', latitude:null, longitude:null, post_count:0, latest_post_at:event.published_at, severity_counts:{} };
      pin.post_count++;
      if (published > originalTime(pin.latest_post_at)) pin.latest_post_at = event.published_at;
      const severity = ({low:'Low',mid:'Medium',medium:'Medium',high:'High'})[normalize(event.severity)] || 'Unspecified';
      pin.severity_counts[severity] = (pin.severity_counts[severity] || 0) + 1;
      groups.set(key,pin);
    }
  }
  return [...groups.values()].map(pin => {
    const counts = Object.entries(pin.severity_counts), max = Math.max(...counts.map(([,count]) => count));
    const leaders = counts.filter(([,count]) => count === max);
    return {...pin,severity:leaders.length === 1 ? leaders[0][0] : 'Mixed'};
  });
}

export async function loadAdminFloodSignals(endpoint, scope, boundaries, fetcher = fetch, now = Date.now()) {
  let progress, status = '';
  try {
    const response = await fetcher(endpoint + '?' + new URLSearchParams({action:'nlp-progress',location:scope}), {credentials:'include',cache:'no-store'});
    if (!response.ok) throw Error('HTTP ' + response.status);
    progress = await response.json();
    if (!Array.isArray(progress.pins)) throw Error('Invalid signal response');
    if (progress.pins.length) return progress;
  } catch (error) { status = error.message; }
  const response = await fetcher(endpoint + '?' + new URLSearchParams({action:'nlp-events',location:scope,limit:'100'}), {credentials:'include',cache:'no-store'});
  if (!response.ok) throw Error('NLP signal request ' + (status || 'returned no locations') + '; classified-post request HTTP ' + response.status);
  const feed = await response.json();
  if (!Array.isArray(feed.events)) throw Error('Classified-post response is invalid');
  const pins = provisionalBarangaySignals(feed.events,boundaries,now);
  return {...(progress || {cities:[],required_posts:null,window_minutes:1440}),pins,provisional_fallback:true,signal_error:status};
}
