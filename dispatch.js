(async function(){
  const $ = id => document.getElementById(id);
  const status = $("status");
  const set = (id, v) => { const el=$(id); if(el) el.textContent = String(v ?? "-") || "-"; };
  const esc = window.OW.escapeHtml;
  function msg(t, bad){ status.textContent=t; status.style.color=bad?"#ffb4b4":""; }
  function fmtSpeed(v){ const n=Number(v); return Number.isFinite(n)&&n>0 ? `${n.toFixed(0)} mph` : "-"; }

  async function loadVtc(){
    try { const data = await OW.request('/api/vtc/name'); set('vtcName', data.vtcName || data.name || data.serverName || '-'); }
    catch(e){ set('vtcName','-'); }
  }
  async function loadDrivers(){
    const result = await OW.best(['/api/dispatch/drivers/live','/api/eld/driver/status','/api/map/live']);
    const rows = OW.rows(result.data);
    const list = $('drivers');
    if(!rows.length){ list.innerHTML='<div class="ow-row">No live drivers reporting yet.</div>'; return rows; }
    list.innerHTML = rows.slice(0,20).map(d => `<div class="ow-row"><strong>${esc(OW.pick(d,['driverName','name','username','discordUserId']))}</strong><br>Duty: ${esc(OW.pick(d,['dutyStatus','status']))} • Truck: ${esc(OW.pick(d,['truck','truckId','vehicle']))} • Load: ${esc(OW.pick(d,['loadNumber','currentLoad.loadNumber']))}<br><span class="ow-muted">${esc(OW.pick(d,['location','city','lastLocation']))} ${esc(OW.pick(d,['lastSeenUtc','updatedUtc','timestamp'],''))}</span></div>`).join('');
    const first = rows[0] || {};
    set('dutyStatus', OW.pick(first,['dutyStatus','status'])); set('truck', OW.pick(first,['truck','truckId','vehicle'])); set('loadNumber', OW.pick(first,['loadNumber','currentLoad.loadNumber'])); set('speed', fmtSpeed(OW.pick(first,['speedMph','speed','mph'],0))); set('location', OW.pick(first,['location','city','lastLocation']));
    return rows;
  }
  async function loadLoads(){
    const result = await OW.best(['/api/dispatch/loads','/api/loads','/api/dispatch/board']);
    const rows = OW.rows(result.data);
    const list = $('loads');
    if(!rows.length){ list.innerHTML='<div class="ow-row">No active loads found for this VTC.</div>'; return; }
    list.innerHTML = rows.slice(0,20).map(l => `<div class="ow-row"><strong>Load ${esc(OW.pick(l,['loadNumber','number','id']))}</strong> <span class="ow-muted">${esc(OW.pick(l,['status','state']))}</span><br>${esc(OW.pick(l,['commodity','cargo']))}<br>${esc(OW.pick(l,['pickupLocation','origin','pickup']))} → ${esc(OW.pick(l,['dropoffLocation','destination','dropoff']))}<br><span class="ow-muted">Driver: ${esc(OW.pick(l,['driverName','driver','driverDiscordUserId']))} • Truck: ${esc(OW.pick(l,['truckId','truck']))}</span></div>`).join('');
  }
  async function refresh(){
    const gid = OW.guildId(); $('guildInput').value = gid;
    if(!gid){ msg('Enter a Discord guild/server ID to load live VTC data.', true); return; }
    msg('Loading live data...', false);
    try { await Promise.all([loadVtc(), loadLoads(), loadDrivers()]); msg(`Live data loaded for guild ${gid}.`, false); }
    catch(e){ msg(e.message || 'Could not load live data.', true); }
  }
  $('saveGuildBtn').addEventListener('click',()=>{ OW.setGuildId($('guildInput').value); const u=new URL(location.href); u.searchParams.set('guildId',$('guildInput').value.trim()); history.replaceState({},'',u); refresh(); });
  $('refreshBtn').addEventListener('click', refresh);
  await refresh(); setInterval(refresh, 15000);
})();
