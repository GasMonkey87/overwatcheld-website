(async function(){
  // Replacement for the broken placeholder dispatch.js file.
  const $ = id => document.getElementById(id);
  const esc = window.OW ? OW.escapeHtml : (v => String(v ?? ''));
  const existing = {
    loadList: $('loadList') || $('loads') || $('dispatchLoads'),
    driverList: $('driverList') || $('drivers') || $('liveDrivers'),
    boardCounts: $('boardCounts') || $('counts') || $('dispatchSummary'),
    refreshBtn: $('refreshBtn')
  };
  if (!window.OW) { console.error('Missing /assets/api.js'); return; }
  function ensure(id, title){
    let el=$(id); if(el) return el;
    const main=document.querySelector('main')||document.body; const sec=document.createElement('section'); sec.innerHTML=`<h2>${title}</h2><div id="${id}"></div>`; main.appendChild(sec); return sec.querySelector(`#${id}`);
  }
  const loadsEl = existing.loadList || ensure('loadList','Live Loads');
  const driversEl = existing.driverList || ensure('driverList','Live Drivers');
  const countsEl = existing.boardCounts || ensure('boardCounts','Dispatch Summary');
  async function refresh(){
    try{
      const [board, loads, drivers] = await Promise.allSettled([
        OW.request('/api/dispatch/board'), OW.request('/api/dispatch/loads'), OW.request('/api/dispatch/drivers/live')
      ]);
      const b = board.status==='fulfilled' ? board.value : {}; const c=b.counts||{};
      countsEl.textContent = `Unassigned: ${c.unassigned ?? 0} | Assigned: ${c.assigned ?? 0} | In Transit: ${c.inTransit ?? c.in_transit ?? 0} | Delivered: ${c.delivered ?? 0} | Delayed: ${c.delayed ?? 0}`;
      const loadRows = loads.status==='fulfilled' ? OW.rows(loads.value) : [];
      loadsEl.innerHTML = loadRows.length ? loadRows.map(l=>`<div class="row"><strong>Load ${esc(OW.pick(l,['loadNumber','id']))}</strong> ${esc(OW.pick(l,['status']))}<br>${esc(OW.pick(l,['commodity']))} • ${esc(OW.pick(l,['pickupLocation','origin']))} → ${esc(OW.pick(l,['dropoffLocation','destination']))}<br>Driver: ${esc(OW.pick(l,['driverName','driverDiscordUserId']))} • Truck: ${esc(OW.pick(l,['truckId','truck']))}</div>`).join('') : '<div class="row">No loads found.</div>';
      const driverRows = drivers.status==='fulfilled' ? OW.rows(drivers.value) : [];
      driversEl.innerHTML = driverRows.length ? driverRows.map(d=>`<div class="row"><strong>${esc(OW.pick(d,['driverName','discordUserId']))}</strong> ${esc(OW.pick(d,['dutyStatus','status']))}<br>Truck: ${esc(OW.pick(d,['truck','truckId']))} • Load: ${esc(OW.pick(d,['loadNumber']))} • ${esc(OW.pick(d,['location']))}</div>`).join('') : '<div class="row">No live drivers found.</div>';
    }catch(e){ countsEl.textContent = e.message || 'Could not load dispatch data.'; }
  }
  existing.refreshBtn?.addEventListener('click', refresh);
  await refresh(); setInterval(refresh,15000);
})();
