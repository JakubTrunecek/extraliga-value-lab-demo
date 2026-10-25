import {appFetch as fetch} from './pages-client.js';
import {rejectionReasons} from './odds-explanation.js';
import {mergeScheduledMatches} from './matches.js';
import {choiceForGame,rankOpportunities,tierFor,tiers} from './value-rank.js';
import {settlementClass,settlementLabel,frozenPickText,settlementOutcome,matchPhase,phaseLabel} from './settlement-ui.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const stamp=s=>new Date(s).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'});
const day=s=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
let schedule=[],scheduleLoaded=false;
let data,serverAvailable=false,serverInfo='',refreshNote='',refreshReason='',busy=false,settlements=new Map();
const names={result60:'Výsledek po 60 minutách',shotsMore:'Kdo má více střel',shots:'Střely celkem',penaltiesMore:'Kdo má více dvouminutových trestů',penalties:'Dvouminutové tresty celkem',goals:'Góly celkem'};
const selectedName=(r,e)=>r.side==='HOME'?e.home:r.side==='AWAY'?e.away:r.side==='DRAW'?'Stejně / remíza':`${r.side==='over'?'Více':'Méně'} než ${num(r.line,1)}`;
function comparisonTable(rows,e){return `<div class="table-wrap"><table><thead><tr><th>Příležitost</th><th>Volba</th><th>Kurz</th><th>Šance</th><th>Férový kurz</th><th>Modelový rozdíl</th><th>Hodnocení</th></tr></thead><tbody>${rows.map(r=>{const tier=tierFor(r);return `<tr><td>${esc(names[r.market]??r.market)}</td><td>${esc(selectedName(r,e))}</td><td><strong>${num(r.odds)}</strong></td><td>${num(r.p*100,1)} %</td><td>${num(r.fair)}</td><td>${num(r.ev*100,1)} %</td><td>${tier?`<span class="odds-tier odds-tier-${tier}">${tiers[tier].label}</span>`:'—'}</td></tr>`}).join('')}</tbody></table></div>`}
const clock=s=>new Date(s).toLocaleTimeString('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit'});
const dateLabel=s=>s?new Date(`${s}T12:00:00Z`).toLocaleDateString('cs-CZ',{day:'numeric',month:'long',timeZone:'UTC'}):'Bez vybraného dne';
const metrics=r=>`<div class="odds-metrics"><span><b>${num(r.p*100,1)} %</b> odhad šance</span><span><b>${num(r.odds)}</b> kurz Tipsportu</span><span><b>${r.ev>=0?'+':''}${num(r.ev*100,1)} %</b> modelový rozdíl</span></div>`;
const pickName=(r,e)=>`${selectedName(r,e)}${r.line===null?'':` ${r.market==='shots'||r.market==='shotsMore'?'střel':r.market==='goals'?'gólů':r.market==='penalties'?'vyloučení':''}`}`.trim();
function settlementBanner(record){
 if(!record)return '';
 const verified=record.status==='settled';
 return `<div class="settlement-banner ${settlementClass(record)}"><strong>${settlementLabel(record)}</strong><span>${esc(frozenPickText(record))}${verified?` · ${esc(settlementOutcome(record))}`:''}</span><small>${verified?'Před zápasem uložená volba; výsledek ověřen.':'Zatím bez potvrzeného vyhodnocení.'}</small></div>`;
}
function marketDetails(rows,e){
 const order=['goals','result60','penalties','penaltiesMore','shots','shotsMore'];
 return order.filter(m=>rows.some(r=>r.market===m)).map(m=>{
  const group=rows.filter(r=>r.market===m).sort((a,b)=>(a.line??0)-(b.line??0));
  return `<details class="odds-market"><summary><span>${esc(names[m])}</span><small>${group.length} ${group.length===1?'kurz':group.length<5?'kurzy':'kurzů'}</small></summary>${comparisonTable(group,e)}</details>`;
 }).join('');
}
function winnerDetail(e){
 const w=e.winnerDecision;
 const note=!w?'Tento starší snímek samostatný trh ještě neeviduje. Dostupnost ověří až další řádné načtení.':w.status==='missing-market'?'V tomto snímku samostatný dvoucestný kurz chybí.':w.status!=='available'?'Nabídka je neúplná nebo nejednoznačná; kurz nepoužíváme.':'Přesný dvoucestný trh. Pravděpodobnost níže vychází jen z kurzů po odstranění marže.';
 return '<details class="odds-market"><summary>Vítěz do rozhodnutí <small>Pouze kurzy</small></summary><p class="small">'+esc(note)+'</p>'+(w?.status==='available'?'<div class="table-wrap"><table><thead><tr><th>Tým</th><th>Kurz</th><th>Z kurzu bez marže</th></tr></thead><tbody>'+w.quotes.map(q=>'<tr><td>'+esc(q.side==='HOME'?e.home:e.away)+'</td><td>'+num(q.odds)+'</td><td>'+num(q.marketP*100,1)+' %</td></tr>').join('')+'</tbody></table></div>':'')+'<p class="small">Požadovaný rozsah je včetně prodloužení a nájezdů. Chybí úplné potvrzení pravidel, ověřené vyhodnocení obou způsobů rozhodnutí a samostatně prověřený model. Nevstupuje do tipu dne. Kurz po 60 minutách jej nenahrazuje.</p></details>';
}
function render(){
 if(!data)return;
 const date=$('odds-date').value,side=$('odds-side').value;
 const now=Date.now(),age=Math.max(0,Math.floor((now-Date.parse(data.retrievedAt))/60000));
 const events=mergeScheduledMatches(data.events,schedule,now).filter(e=>e.matchDate===date).sort((a,b)=>Date.parse(a.startTime)-Date.parse(b.startTime));
 $('odds-status').textContent=`Kurzy načteny ${stamp(data.retrievedAt)} · před ${age} min. ${serverInfo}`;
 $('odds-check-detail').textContent=refreshNote;
 const usable=Number.isFinite(age)&&age<=15;
 $('odds-context').textContent=usable?'Než vsadíš, ověř kurz přímo u Tipsportu. Modelový rozdíl není záruka výhry.':`Cena je starší než 15 minut a vyžaduje ověření. Odhad zůstává viditelný. Automatika kontroluje plán hodinově; poskytovatelský odstup je 6 h / 2 h / 30 min podle blízkosti zápasu. Stáří nad 15 minut samo o sobě neznamená poruchu. ${refreshReason||'Nové nabídky načítá automatika; návštěva stránky další dotaz nespustí.'}`;
 if(!scheduleLoaded)$('odds-context').textContent+=' Rozpis se nepodařilo načíst; přehled může být neúplný.';
 const ideas=events.map(event=>({event,item:rankOpportunities(event.comparisons??[])[0]})).filter(x=>x.item)
  .sort((a,b)=>tiers[b.item.tier].order-tiers[a.item.tier].order||b.item.row.p-a.item.row.p||b.item.row.ev-a.item.row.ev);
 const live=ideas.filter(x=>Date.parse(x.event.startTime)>now);
 const top=live[0],actionable=usable&&live.length>0;
 const hasModel=events.some(e=>(e.comparisons??[]).some(r=>['goals','result60'].includes(r.market)));
 const title=actionable?'Tip dne k prověření':!hasModel?'Chybí data pro tip':!usable?(top?'Modelový signál · ověř aktuální kurz':'Uložené odhady · ověř aktuální kurzy'):'Bez tipu po kontrole';
 const topHtml=`<div class="panel odds-top ${actionable?'odds-top-active':''}"><div class="odds-top-head"><div><p class="eyebrow">${esc(dateLabel(date))} · ${events.length} ${events.length===1?'zápas':events.length<5?'zápasy':'zápasů'}</p><h2>${title}</h2></div><span class="pill">${actionable?`${live.length} k prověření`:!hasModel?'Bez podkladů':usable?'Bez aktuálního tipu':'Archivní ceny'}</span></div>${top?`<p class="odds-top-match">${esc(top.event.home)} × ${esc(top.event.away)} · ${esc(clock(top.event.startTime))}</p><h3>${esc(names[top.item.row.market])}: ${esc(pickName(top.item.row,top.event))}</h3><span class="odds-tier odds-tier-${top.item.tier}">${tiers[top.item.tier].label}</span>${metrics(top.item.row)}<p class="odds-caveat">${actionable?`${tiers[top.item.tier].note} Ověř aktuální kurz u Tipsportu; ani tento tip není jistota.`:'Modelový signál z posledního snímku. Cena je starší než 15 minut; před použitím je nutné ověřit aktuální kurz. Splnění filtru na staré ceně nezaručuje jeho splnění nyní.'}</p>`:`<p class="odds-empty">${!hasModel?'Pro tento den chybí použitelná nabídka nebo výpočet. Nejde o rozhodnutí bez tipu.':!usable?'Odhady jsou níže u zápasů; žádný neprošel filtrem modelového signálu. Ceny jsou navíc starší než 15 minut a vyžadují ověření. Čerstvý přenos stránky neznamená čerstvé kurzy.':hasModel?'Žádná dostupná předzápasová volba neprošla filtrem aktuálního průzkumného tipu. U některých zápasů mohou chybět podklady.':events.length?'Chybí použitelný kurz nebo modelový výpočet; nejde o rozhodnutí, že value neexistuje.':'V uložené nabídce pro tento den nejsou zápasy.'}</p>`}</div>`;
 $('odds-games').innerHTML=topHtml+(events.length?`<div class="odds-section-title"><h2>Zápasy kola</h2><span>${events.filter(e=>choiceForGame(e.comparisons??[])).length} z ${events.length} s uloženým odhadem · ${live.length} modelových signálů · ${usable?live.length:0} s nedávnou cenou</span></div><div class="odds-match-grid">`+events.map(e=>{
  const started=e.startTime?Date.parse(e.startTime)<=now:e.completed===true,rows=(e.comparisons??[]).filter(r=>side==='all'||!['shots','goals','penalties'].includes(r.market)||r.side===side);
  const reference=choiceForGame(e.comparisons??[]),best=reference,current=usable&&!started&&!!e.startTime,missing=(e.missingMarkets??[]).map(m=>names[m]).filter(Boolean);
  const fixtureId=e.fixtureId??e.comparisons?.[0]?.fixtureId,record=started&&fixtureId?settlements.get(String(fixtureId)):null;
  const settled=record?.date===e.matchDate?record:null;
  return `<article class="panel odds-game ${settlementClass(settled)}"><div class="odds-game-head"><span class="odds-time">${e.startTime?esc(clock(e.startTime)):'Čas nepotvrzen'}</span><div><h3>${esc(e.home)} <span>×</span> ${esc(e.away)}</h3><p class="odds-game-state">${e.scheduleOnly?(started?phaseLabel(matchPhase({...settled,startTime:e.startTime}))+' · bez nabídky':'Rozpis · bez nabídky'):started?phaseLabel(matchPhase({...settled,startTime:e.startTime}))+' · pouze archiv':usable?'Předzápasový snímek':'Starší snímek'}</p></div><span class="pill ${best&&current?'odds-pill-'+best.tier:''}">${best?current?(best.tier==='reference'?'Odhad · bez tipu':tiers[best.tier].label):'Archivní odhad':reference?(usable?'Bez tipu':'Archivní odhad'):(e.comparisons??[]).some(r=>['goals','result60'].includes(r.market))?'Bez tipu':'Chybí data'}</span></div>${settlementBanner(settled)}${best?`<div class="odds-pick odds-pick-${best.tier} ${current?'':'odds-pick-archive'}"><span>${started?'Předzápasový odhad · zápas už začal':best.tier==='reference'?'Modelový odhad · neprošel filtrem tipu':current?'Průzkumný tip k prověření':'Uložený modelový odhad · stará cena'}</span><strong>${esc(names[best.row.market])}: ${esc(pickName(best.row,e))}</strong>${metrics(best.row)}<p>${esc(rejectionReasons(best.row).join(' '))} ${started?'Nový tip po začátku nevytváříme.':!usable?'Chybí čerstvý kurz: uložená cena není aktuální nabídkou.':tiers[best.tier].note}</p></div>`:`<p class="odds-no-pick">${started?'Zápas už začal; nový tip nevytváříme.':reference?(usable?'Bez tipu po kontrole filtrů. Orientační odhad najdeš v detailu.':'Starší odhad neprošel filtrem tipu. Podrobnosti najdeš v detailu; aktuální rozhodnutí vyžaduje čerstvé ceny.'):(e.comparisons??[]).some(r=>['goals','result60'].includes(r.market))?'Bez tipu po kontrole filtrů.':e.scheduleOnly?'Zápas je v rozpisu, ale chybí přiřazená nabídka. To není rozhodnutí bez tipu.':'Chybí použitelný kurz nebo modelové podklady.'}</p>`}<p class="small">${e.scheduleOnly?'Kurz zatím není k dispozici.':'Ceny načteny '+esc(stamp(data.retrievedAt))+' · před '+age+' min.'}</p><details class="odds-game-details"><summary>Odhady a dostupné kurzy <span>${rows.length} položek</span></summary>${rows.length?marketDetails(rows,e):'<p>Pro tento zápas nemáme podporovaný předzápasový kurz a použitelný výpočet.</p>'}${winnerDetail(e)}${missing.length?`<p class="small">Chybějící trhy: ${esc(missing.join(', '))}.</p>`:''}<p class="small">Tresty zatím nemají potvrzená pravidla; všechny odhady jsou modelové a hodnotu sázek jsme dosud neověřili na souvislé historii cen.</p></details></article>`;
 }).join('')+'</div>':'');
}
function update(view){
 const selected=$('odds-date').value;data=view;
 const dates=[...new Set(mergeScheduledMatches(data.events,schedule).map(e=>e.matchDate))].sort();
 $('odds-date').innerHTML=dates.map(d=>`<option value="${d}">${d.split('-').reverse().join('. ')}</option>`).join('');
 const today=day(new Date());if(dates.includes(selected))$('odds-date').value=selected;else if(dates.includes(today))$('odds-date').value=today;else $('odds-date').value=dates.find(d=>d>today)??dates.at(-1)??'';
 $('odds-receipt').textContent=`Archivováno ${stamp(data.capturedAt)}. Kontrolní otisk ${data.archiveSha256?.slice(0,12)??'dosud není'}…`;
 render();
}
async function refresh(){
 if(!serverAvailable||busy||document.hidden)return;
 busy=true;const button=$('odds-refresh');if(button){button.disabled=true;button.textContent='Kontroluji kurzy…';}
 try{const response=await fetch('/api/refresh',{method:'POST',headers:{'X-Value-Lab':'refresh'}});
 if(!response.ok)throw Error('Server není dostupný.');const body=await response.json();
 serverInfo=`· ${body.usage.attempts31Days}/${body.usage.limit} kontrol za 31 dnů${body.lastStatus==='error'?' · poslední pokus selhal':''}`;
 refreshReason=body.reason??'';refreshNote=refreshReason;
 if(body.failureCode)refreshNote+=` Kód chyby: ${body.failureCode}.`;
 if(Number(body.nextAt)>Date.now())refreshNote+=` Další možný pokus: ${stamp(Number(body.nextAt))}.`;
 if(body.statistics)refreshNote+=` Statistiky: ${({ok:'aktualizováno',partial:'část detailů nedostupná',error:'aktualizace selhala, používáme uložená data',pending:'aktualizace probíhá',seed:'výchozí archiv'})[body.statistics.status]??'neznámý stav'}; poslední góly v modelu ${body.statistics.latestGoalsDate??'neznámé'}; rozpis načten ${stamp(body.statistics.retrievedAt)}.`;
 window.dispatchEvent(new Event('statistics-updated'));
 update(body.view);
 }catch{refreshReason='Aktualizace není dostupná; zobrazujeme poslední uloženou nabídku.';refreshNote=refreshReason;render();}finally{busy=false;if(button){button.disabled=false;button.textContent='Aktualizovat kurzy';}}
}
async function init(){try{
 let view;try{const response=await fetch('/api/odds');if(response.ok){const body=await response.json();view=body.view;serverAvailable=false;serverInfo=`· ${body.usage.attempts31Days}/${body.usage.limit} kontrol za 31 dnů${body.lastStatus==='error'?' · poslední pokus selhal':''}`;}}catch{}
 if(!view)throw Error('Aktuální přenos kurzů není dostupný.');
 try{const r=await fetch('/api/data');if(r.ok){const body=await r.json();schedule=body.rounds?.fixtures??[];scheduleLoaded=true;}}catch{}
 $('odds-date').addEventListener('change',render);$('odds-side').addEventListener('change',render);
 const button=document.createElement('button');button.id='odds-refresh';button.type='button';button.className='secondary';button.textContent='Aktualizovat kurzy';button.hidden=!serverAvailable;$('odds-date').closest('.round-controls').append(button);button.addEventListener('click',refresh);
 
 update(view);setInterval(render,60000);
}catch(error){$('odds-status').textContent=error.message;}}
window.addEventListener('statistics-updated',async()=>{try{const [r,o]=await Promise.all([fetch('/api/data'),fetch('/api/odds')]);if(r.ok){const b=await r.json();schedule=b.rounds?.fixtures??[];scheduleLoaded=true;}if(o.ok){const b=await o.json();if(b.view)update(b.view);}}catch{}});
window.addEventListener('settlement-updated',event=>{settlements=new Map((event.detail??[]).map(record=>[String(record.fixtureId),record]));render();});
init();
