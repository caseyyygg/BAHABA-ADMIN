import {map as createMap,tileLayer,circleMarker,layerGroup,geoJSON} from './map-vendor/leaflet.mjs';
const view=document.getElementById('view-command');
const panel=document.createElement('section');panel.className='panel command-live-panel';panel.hidden=true;
panel.innerHTML=`<div class="panel-head"><div><h3>Live map · All locations</h3><p class="view-sub">Report pins and flood detections across every LGU. Refreshes every 15 seconds.</p></div><button type="button" class="btn btn-outline">Refresh map</button></div><div class="panel-body"><div class="metric-row" data-metrics></div><div id="command-live-map" aria-label="Live map of reports across all locations"></div><p class="view-sub" data-sync role="status"></p><p class="view-sub command-map-legend">Blue: report · Orange: NLP flood signal · Red: high severity. Reports without coordinates appear at an approximate barangay or city position. Hidden reports are excluded from the map.</p><h3>Reports by location</h3><div class="command-location-table"><table><thead><tr><th>Location</th><th>Reports</th><th>Pending</th><th>High severity</th><th>NLP flood signals (24h)</th></tr></thead><tbody></tbody></table></div><div class="command-location-pages" hidden><span data-page-status role="status"></span><div><button type="button" class="btn btn-outline btn-sm" data-page="previous">Previous</button><button type="button" class="btn btn-outline btn-sm" data-page="next">Next</button></div></div></div>`;
view.querySelector('#command-metrics').after(panel);
const style=document.createElement('style');style.textContent='.command-live-panel[hidden]{display:none}.command-live-panel .panel-head{gap:16px;flex-wrap:wrap}.command-live-panel .panel-body{padding:20px}#command-live-map{height:460px;border:1px solid var(--line);border-radius:12px;margin:16px 0;z-index:0}.command-live-panel .metric-row{margin:0}.command-live-panel h3{margin:8px 0;font-size:15px;font-weight:650}.command-live-panel .metric-card strong{display:block;font-size:26px;line-height:1.2;margin-bottom:6px}.command-live-panel .metric-card>div{font-size:12px;color:var(--ink-soft)}.command-map-legend{padding:12px 14px;background:#f4f7fb;border-radius:10px;line-height:1.7;margin:12px 0 22px}.command-location-table{overflow:auto;border:1px solid #e1e8f0;border-radius:12px;margin-top:14px}.command-location-table table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}.command-location-table th{background:#f4f7fb;color:#536b87;font-size:11px;font-weight:600;text-align:left;padding:14px 16px}.command-location-table td{padding:14px 16px;border-top:1px solid #e8eef5;color:#243c57;font-variant-numeric:tabular-nums}.command-location-table th:not(:first-child),.command-location-table td:not(:first-child){text-align:right}.command-location-table tbody tr:hover{background:#f8fafc}.command-location-table td:first-child{font-weight:600}.command-location-pages{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;font-size:12px;color:#57697f}.command-location-pages[hidden]{display:none}.command-location-pages>div{display:flex;gap:8px}.command-location-pages button:disabled{opacity:.45;cursor:default}@media(max-width:650px){#command-live-map{height:340px}}';document.head.append(style);
let map,pins,busy=false,geometry,first=true,locationPage=1,locationRows=[];
const pageSize=10;
function renderLocations(){
 const pages=Math.max(1,Math.ceil(locationRows.length/pageSize));
 locationPage=Math.min(locationPage,pages);
 const tbody=panel.querySelector('tbody');tbody.replaceChildren();
 for(const [name,g] of locationRows.slice((locationPage-1)*pageSize,locationPage*pageSize)){
  const row=document.createElement('tr');[name,g.reports,g.pending,g.high,g.signals].forEach(t=>cell(row,t));tbody.append(row);
 }
 if(!locationRows.length){const row=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='No reports received yet.';row.append(td);tbody.append(row);}
 panel.querySelector('.command-location-pages').hidden=locationRows.length<10;
 panel.querySelector('[data-page-status]').textContent=`Page ${locationPage} of ${pages} | ${locationRows.length} locations`;
 panel.querySelector('[data-page="previous"]').disabled=locationPage===1;
 panel.querySelector('[data-page="next"]').disabled=locationPage===pages;
}
panel.querySelector('[data-page="previous"]').onclick=()=>{locationPage=Math.max(1,locationPage-1);renderLocations();};
panel.querySelector('[data-page="next"]').onclick=()=>{locationPage++;renderLocations();};
const norm=value=>String(value||'').toLowerCase().replace(/city of | city| municipality|\(capital\)/g,'').trim();
const allowed=()=>typeof session!=='undefined'&&session?.role==='platform-admin'&&canAdminModule(session,'admin_overview');
function cell(row,text){const td=document.createElement('td');td.textContent=text;row.append(td);}
function point(item){
 if(item.latitude!=null&&item.longitude!=null&&Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&Math.abs(Number(item.latitude))<=90&&Math.abs(Number(item.longitude))<=180)return {latlng:[Number(item.latitude),Number(item.longitude)],exact:true};
 const city=norm(item.city||item.location),barangay=norm(item.barangay);
 if(!city)return null;
 const matches=geometry.features.filter(f=>norm(f.properties.city)===city);
 const local=matches.filter(f=>norm(f.properties.name)===barangay);
 const features=local.length===1?local:matches;
 if(!features.length)return null;
 const bounds=geoJSON({type:'FeatureCollection',features}).getBounds();
 return bounds.isValid()?{latlng:bounds.getCenter(),exact:false}:null;
}
async function refresh(){
 if(!allowed()||!view.classList.contains('active')||document.hidden||busy)return;
 panel.hidden=false;busy=true;const sync=panel.querySelector('[data-sync]');
 try{
  if(!map){map=createMap('command-live-map').setView([14.9,120.9],9);tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);pins=layerGroup().addTo(map);new ResizeObserver(()=>map.invalidateSize()).observe(panel);}
  const [response,dataGeometry]=await Promise.all([fetch(ADMIN_API_URL+'?action=command-overview',{credentials:'include',cache:'no-store'}),geometry?Promise.resolve(geometry):fetch('./map-data/barangays.json').then(r=>{if(!r.ok)throw Error('Map locations unavailable');return r.json();})]);
  const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load reports');
  if(!allowed()){panel.hidden=true;return;}geometry=dataGeometry;
  const reports=data.reports||[],signals=(data.nlpEvents||[]).filter(r=>String(r.classification).toLowerCase()==='flood');
  const pending=reports.filter(r=>['pending','new'].includes(r.status)).length;
  const metrics=panel.querySelector('[data-metrics]');metrics.replaceChildren();
  for(const [label,value] of [['All reports',reports.length],['Pending reports',pending],['High severity reports',reports.filter(r=>String(r.severity).toLowerCase()==='high').length],['NLP flood signals · 24h',signals.length]]){const card=document.createElement('div');card.className='metric-card';const n=document.createElement('strong');n.textContent=value;const l=document.createElement('div');l.textContent=label;card.append(n,l);metrics.append(card);}
  pins.clearLayers();const positions=[];let unmapped=0;
  for(const item of [...reports.map(r=>({...r,kind:'report'})),...signals.map(r=>({...r,kind:'NLP flood signal'}))]){
   if(Number(item.map_hidden))continue;const location=point(item);if(!location){unmapped++;continue;}positions.push(location.latlng);
   const popup=document.createElement('div');const title=document.createElement('strong');title.textContent=`${item.kind} · ${item.city||item.location||''}`;popup.append(title);
   for(const text of [item.barangay,item.description||item.post_text,`${item.severity||'Unknown severity'} · ${item.status||'New signal'}`,location.exact?'Exact report location':'Approximate area location']){const p=document.createElement('p');p.textContent=text||'';popup.append(p);}
   circleMarker(location.latlng,{radius:location.exact?8:11,color:'#fff',weight:2,fillOpacity:.8,fillColor:String(item.severity).toLowerCase()==='high'?'#dc2626':item.kind==='report'?'#176be8':'#f59e0b'}).bindPopup(popup).addTo(pins);
  }
  if(first&&positions.length){map.fitBounds(positions,{padding:[30,30],maxZoom:12});first=false;}map.invalidateSize();
  const groups=new Map();for(const item of [...reports,...signals.map(s=>({...s,isSignal:true}))]){const name=item.city||item.location||'Location unresolved';const group=groups.get(name)||{reports:0,pending:0,high:0,signals:0};if(item.isSignal)group.signals++;else{group.reports++;if(['pending','new'].includes(item.status))group.pending++;if(String(item.severity).toLowerCase()==='high')group.high++;}groups.set(name,group);}
  locationRows=[...groups].sort((a,b)=>a[0].localeCompare(b[0]));renderLocations();
  sync.textContent=`Updated ${new Date().toLocaleTimeString()} · ${positions.length} mapped pings · ${unmapped} without a mapped location`;
 }catch(error){sync.textContent=`Update failed: ${error.message}. Previously loaded data may be out of date.`;}finally{busy=false;}
}
panel.querySelector('button').onclick=refresh;
new MutationObserver(()=>{panel.hidden=!allowed();refresh();}).observe(view,{attributes:true,attributeFilter:['class']});
setInterval(()=>{panel.hidden=!allowed();refresh();},15000);refresh();
