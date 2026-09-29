import {rankOpportunities,tierFor,tiers} from './value-rank.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const stamp=s=>new Date(s).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'});
const day=s=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
let data,serverAvailable=false,serverInfo='',refreshNote='',busy=false,autoChecked=false;
const names={result60:'Výsledek po 60 minutách',shotsMore:'Kdo má více střel',shots:'Střely celkem',penaltiesMore:'Kdo má více dvouminutových trestů',penalties:'Dvouminutové tresty celkem',goals:'Góly celkem'};
const selectedName=(r,e)=>r.side==='HOME'?e.home:r.side==='AWAY'?e.away:r.side==='DRAW'?'Stejně / remíza':`${r.side==='over'?'Více':'Méně'} než ${num(r.line,1)}`;
function comparisonTable(rows,e){return `<div class="table-wrap"><table><thead><tr><th>Příležitost</th><th>Volba</th><th>Kurz</th><th>Šance</th><th>Férový kurz</th><th>Modelový rozdíl</th><th>Hodnocení</th></tr></thead><tbody>${rows.map(r=>{const tier=tierFor(r);return `<tr><td>${esc(names[r.market]??r.market)}</td><td>${esc(selectedName(r,e))}</td><td><strong>${num(r.odds)}</strong></td><td>${num(r.p*100,1)} %</td><td>${num(r.fair)}</td><td>${num(r.ev*100,1)} %</td><td>${tier?`<span class="odds-tier odds-tier-${tier}">${tiers[tier].label}</span>`:'—'}</td></tr>`}).join('')}</tbody></table></div>`}
const clock=s=>new Date(s).toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});
const dateLabel=s=>s?new Date(`${s}T12:00:00Z`).toLocaleDateString('cs-CZ',{day:'numeric',month:'long',timeZone:'UTC'}):'Bez vybraného dne';
const metrics=r=>`<div class="odds-metrics"><span><b>${num(r.p*100,1)} %</b> odhad šance</span><span><b>${num(r.odds)}</b> kurz Tipsportu</span><span><b>${r.ev>=0?'+':''}${num(r.ev*100,1)} %</b> modelový rozdíl</span></div>`;
const pickName=(r,e)=>`${selectedName(r,e)}${r.line===null?'':` ${r.market==='shots'||r.market==='shotsMore'?'střel':r.market==='goals'?'gólů':''}`}`.trim();
function marketDetails(rows,e){
 const order=['result60','shotsMore','shots','penaltiesMore','penalties','goals'];
 return order.filter(m=>rows.some(r=>r.market===m)).map(m=>{
  const group=rows.filter(r=>r.market===m).sort((a,b)=>(a.line??0)-(b.line??0));
  return `<details class="odds-market"><summary><span>${esc(names[m])}</span><small>${group.length} ${group.length===1?'kurz':group.length<5?'kurzy':'kurzů'}</small></summary>${comparisonTable(group,e)}</details>`;
 }).join('');
}
function render(){
 if(!data)return;
 const date=$('odds-date').value,side=$('odds-side').value;
 const now=Date.now(),age=Math.max(0,Math.floor((now-Date.parse(data.retrievedAt))/60000));
 const events=data.events.filter(e=>day(e.startTime)===date).sort((a,b)=>Date.parse(a.startTime)-Date.parse(b.startTime));
 $('odds-status').textContent=`Kurzy načteny ${stamp(data.retrievedAt)} · před ${age} min. ${serverInfo}`;
 $('odds-check-detail').textContent=refreshNote;
 const usable=age<=15;
 $('odds-context').textContent=usable?'Než vsadíš, ověř kurz přímo u Tipsportu. Modelový rozdíl není záruka výhry.':'Nabídka je starší než 15 minut. Žebříček níže je jen archivní; zkus aktualizaci.';
 const ideas=events.map(event=>({event,item:rankOpportunities(event.comparisons??[])[0]})).filter(x=>x.item)
  .sort((a,b)=>tiers[b.item.tier].order-tiers[a.item.tier].order||b.item.row.p-a.item.row.p||b.item.row.ev-a.item.row.ev);
 const live=usable?ideas.filter(x=>Date.parse(x.event.startTime)>now):[];
 const shown=live.length?live:ideas,top=shown[0],actionable=live.length>0;
 const title=actionable?'TOP nápad k prověření':top?'Nejlepší nápad z archivu':'Bez modelového nápadu';
 const topHtml=`<div class="panel odds-top ${actionable?'odds-top-active':''}"><div class="odds-top-head"><div><p class="eyebrow">${esc(dateLabel(date))} · ${events.length} ${events.length===1?'zápas':events.length<5?'zápasy':'zápasů'}</p><h2>${title}</h2></div><span class="pill">${actionable?`${live.length} k prověření`:'Neaktuální nabídka'}</span></div>${top?`<p class="odds-top-match">${esc(top.event.home)} × ${esc(top.event.away)} · ${esc(clock(top.event.startTime))}</p><h3>${esc(names[top.item.row.market])}: ${esc(pickName(top.item.row,top.event))}</h3><span class="odds-tier odds-tier-${top.item.tier}">${tiers[top.item.tier].label}</span>${metrics(top.item.row)}<p class="odds-caveat">${actionable?`${tiers[top.item.tier].note} Ověř aktuální kurz u Tipsportu; ani tento tip není jistota.`:'Archivní výpočet. Z této staré ceny teď nesázej; nejprve aktualizuj nabídku.'}</p>`:`<p class="odds-empty">${events.length?'Pro tento den nevidíme modelový rozdíl, který by prošel i uvolněným filtrem.':'V uložené nabídce pro tento den nejsou zápasy.'}</p>`}</div>`;
 const others=shown.slice(1,5);
 const ladder=others.length?`<div class="panel odds-ladder"><div class="odds-section-title"><h2>Další nápady</h2><span>${actionable?'Předzápasové':'Archivní ceny'}</span></div>${others.map(({event,item})=>`<div class="odds-ladder-row"><div><strong>${esc(event.home)} × ${esc(event.away)}</strong><small>${esc(names[item.row.market])} · ${esc(pickName(item.row,event))}</small></div><span class="odds-tier odds-tier-${item.tier}">${tiers[item.tier].label}</span><b>${num(item.row.p*100,0)} %</b><b>${num(item.row.odds)}</b><b>${item.row.ev>=0?'+':''}${num(item.row.ev*100,0)} %</b></div>`).join('')}<p class="small">Poslední sloupec je odhadovaný modelový rozdíl, ne doložený výnos.</p></div>`:'';
 $('odds-games').innerHTML=topHtml+ladder+(events.length?`<div class="odds-section-title"><h2>Zápasy kola</h2><span>${live.length} z ${events.length} s aktuálním nápadem</span></div><div class="odds-match-grid">`+events.map(e=>{
  const started=Date.parse(e.startTime)<=now,rows=(e.comparisons??[]).filter(r=>side==='all'||!['shots','goals','penalties'].includes(r.market)||r.side===side);
  const best=rankOpportunities(e.comparisons??[])[0],current=usable&&!started,missing=(e.missingMarkets??[]).map(m=>names[m]).filter(Boolean);
  return `<article class="panel odds-game"><div class="odds-game-head"><span class="odds-time">${esc(clock(e.startTime))}</span><div><h3>${esc(e.home)} <span>×</span> ${esc(e.away)}</h3><p class="odds-game-state">${started?'Zápas začal · pouze archiv':usable?'Předzápasový snímek':'Starší snímek'}</p></div><span class="pill ${best&&current?'odds-pill-good':''}">${best?current?tiers[best.tier].label:'Archivní nápad':'Bez tipu'}</span></div>${best?`<div class="odds-pick ${current?'':'odds-pick-archive'}"><span>${current?'Nejlepší modelový nápad':'Pouze historické porovnání'}</span><strong>${esc(names[best.row.market])}: ${esc(pickName(best.row,e))}</strong>${metrics(best.row)}<p>${current?tiers[best.tier].note:'Cena není aktuální; pro vsazení ji nelze použít.'}</p></div>`:`<p class="odds-no-pick">${started?'Zápas už začal.':'Žádná nabídka tu neprošla ani uvolněným filtrem šance, kurzu a modelového rozdílu.'}</p>`}<details class="odds-game-details"><summary>Všechny dostupné kurzy <span>${rows.length} položek</span></summary>${rows.length?marketDetails(rows,e):'<p>Pro tento zápas nemáme podporovaný předzápasový kurz a použitelný výpočet.</p>'}${missing.length?`<p class="small">Chybějící trhy: ${esc(missing.join(', '))}.</p>`:''}<p class="small">Tresty zatím nemají potvrzená pravidla; všechny odhady jsou modelové a hodnotu sázek jsme dosud neověřili na souvislé historii cen.</p></details></article>`;
 }).join('')+'</div>':'');
}
function update(view){
 const selected=$('odds-date').value;data=view;
 const dates=[...new Set(data.events.map(e=>day(e.startTime)))].sort();
 $('odds-date').innerHTML=dates.map(d=>`<option value="${d}">${d.split('-').reverse().join('. ')}</option>`).join('');
 const today=day(new Date());if(dates.includes(selected))$('odds-date').value=selected;else if(dates.includes(today))$('odds-date').value=today;else $('odds-date').value=dates.find(d=>d>today)??dates.at(-1)??'';
 $('odds-receipt').textContent=`Archivováno ${stamp(data.capturedAt)}. Kontrolní otisk ${data.archiveSha256?.slice(0,12)??'dosud není'}…`;
 render();
}
async function refresh(){
 if(!serverAvailable||busy||document.hidden)return;
 busy=true;autoChecked=true;const button=$('odds-refresh');if(button){button.disabled=true;button.textContent='Kontroluji kurzy…';}
 try{const response=await fetch('unavailable-server',{method:'POST',headers:{'X-Value-Lab':'refresh'}});
 if(!response.ok)throw Error('Server není dostupný.');const body=await response.json();
 serverInfo=`· ${body.usage.attempts31Days}/${body.usage.limit} kontrol za 31 dnů`;
 refreshNote=body.reason??'';
 if(body.statistics)refreshNote+=` Statistiky: ${({ok:'aktualizováno',partial:'část detailů nedostupná',error:'aktualizace selhala, používáme uložená data',pending:'aktualizace probíhá',seed:'výchozí archiv'})[body.statistics.status]??'neznámý stav'}; poslední střely v modelu ${body.statistics.latestShotsDate??'neznámé'}; rozpis načten ${stamp(body.statistics.retrievedAt)}.`;
 window.dispatchEvent(new Event('statistics-updated'));
 update(body.view);
 }catch{refreshNote='Aktualizace není dostupná; zobrazujeme poslední uloženou nabídku.';render();}finally{busy=false;if(button){button.disabled=false;button.textContent='Aktualizovat kurzy';}}
}
async function init(){try{
 let view;try{const response=await fetch('unavailable-server');if(response.ok){const body=await response.json();view=body.view;serverAvailable=true;serverInfo=`· ${body.usage.attempts31Days}/${body.usage.limit} kontrol za 31 dnů`;}}catch{}
 if(!view){const response=await fetch('data/odds-view.json');if(!response.ok)throw Error('Načtené kurzy nejsou dostupné.');view=await response.json();}
 $('odds-date').addEventListener('change',render);$('odds-side').addEventListener('change',render);
 const button=document.createElement('button');button.id='odds-refresh';button.type='button';button.className='secondary';button.textContent='Aktualizovat kurzy';button.hidden=!serverAvailable;$('odds-date').closest('.round-controls').append(button);button.addEventListener('click',refresh);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!autoChecked)refresh()});
 update(view);await refresh();setInterval(render,60000);
}catch(error){$('odds-status').textContent=error.message;}}
init();
