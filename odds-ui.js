const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const stamp=s=>new Date(s).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'});
const day=s=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
let data,serverAvailable=false,serverInfo='',busy=false;
const names={result60:'Výsledek po 60 minutách',shotsMore:'Kdo má více střel',shots:'Střely celkem',penaltiesMore:'Kdo má více dvouminutových trestů',penalties:'Dvouminutové tresty celkem',goals:'Góly celkem'};
const selectedName=(r,e)=>r.side==='HOME'?e.home:r.side==='AWAY'?e.away:r.side==='DRAW'?'Stejně / remíza':`${r.side==='over'?'Více':'Méně'} než ${num(r.line,1)}`;
const lead=rows=>rows.filter(r=>r.market==='shots'&&r.rulesConfirmed&&r.p>=.55&&r.odds>=1.7&&r.ev>0&&r.conservativeEV>0).sort((a,b)=>b.conservativeEV-a.conservativeEV)[0];
function comparisonTable(rows,e){return `<div class="table-wrap"><table><thead><tr><th>Příležitost</th><th>Volba</th><th>Kurz</th><th>Odhad šance</th><th>Férový kurz</th><th>Rozdíl modelu</th><th>Po rezervě</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(names[r.market]??r.market)}</td><td>${esc(selectedName(r,e))}</td><td><strong>${num(r.odds)}</strong></td><td>${num(r.p*100,1)} %</td><td>${num(r.fair)}</td><td>${num(r.ev*100,1)} %</td><td>${r.conservativeEV===null?'neověřeno':num(r.conservativeEV*100,1)+' %'}</td></tr>`).join('')}</tbody></table></div>`}
function render(){
 if(!data)return;
 const date=$('odds-date').value,side=$('odds-side').value;
 const now=Date.now(),age=Math.max(0,Math.floor((now-Date.parse(data.retrievedAt))/60000));
 const events=data.events.filter(e=>day(e.startTime)===date);
 $('odds-status').textContent=`Načteno ${stamp(data.retrievedAt)} · stáří ${age} min · model ${data.modelVersion}. ${serverAvailable?'Automatická kontrola při otevřeném webu; PulseScore nejvýše jednou za 30 minut.':'Místní archiv; automatické načítání není dostupné.'} ${serverInfo}`;
 const usable=age<=15;
 $('odds-context').textContent=usable?'Čas změny cen u Tipsportu není známý. Ověř kurz přímo tam; modelové rozdíly nejsou prokázaný zisk.':'Uložená nabídka je starší než 15 minut. Zobrazené kurzy a TOP níže jsou pouze historický snímek.';
 const all=events.flatMap(e=>(e.comparisons??[]).map(r=>({...r,event:e}))),top=lead(all);
 const topHtml=`<div class="panel"><p class="eyebrow">TOP ZA VYBRANÝ DEN · VÝZKUMNÝ KANDIDÁT</p>${top?`<h2>${esc(top.event.home)} × ${esc(top.event.away)}: ${esc(selectedName(top,top.event))} střel</h2><p>Odhad ${num(top.p*100,1)} %, kurz ${num(top.odds)}, rozdíl po rezervě ${num(top.conservativeEV*100,1)} %. ${usable&&Date.parse(top.event.startTime)>now?'Kurz ověř přímo u Tipsportu.':'Historický výpočet, zápas nebo kurz už nemusí být aktuální.'}</p><p class="small">Jednotlivé hranice nemají samostatný historický test ani ověřenou návratnost. Není to jistá sázka.</p>`:'<h2>Žádná podložená TOP příležitost</h2><p>Na tomto snímku žádná střelecká hranice neprošla minimální šancí 55 %, kurzem 1,70 a kladnou rezervou modelu. U ostatních trhů zatím chybí ověření.</p>'}</div>`;
 $('odds-games').innerHTML=events.length?topHtml+events.map(e=>{
  const order=['result60','shotsMore','shots','penaltiesMore','penalties','goals'];
  const started=Date.parse(e.startTime)<=now,rows=(e.comparisons??[]).filter(r=>side==='all'||!['shots','goals','penalties'].includes(r.market)||r.side===side).sort((a,b)=>order.indexOf(a.market)-order.indexOf(b.market)||(a.line??0)-(b.line??0));
  const best=lead(e.comparisons??[]),missing=(e.missingMarkets??[]).map(m=>names[m]).filter(Boolean);
  return `<article class="panel"><div class="game-header"><div><p class="eyebrow">${esc(stamp(e.startTime))}</p><h2>${esc(e.home)} × ${esc(e.away)}</h2></div><span class="pill">${started?'Zápas již začal':'Předzápasový snímek'}</span></div><div class="verdict ${best?'':'warn'}">${best?`Nejsilnější výzkumný kandidát: ${esc(selectedName(best,e))} střel · kurz ${num(best.odds)} · odhad ${num(best.p*100,1)} % · rezerva ${num(best.conservativeEV*100,1)} %.`:'Žádná sázka zde neprošla opatrným filtrem; z ostatních trhů zatím nelze vybrat spolehlivý tip.'}</div>${rows.length?comparisonTable(rows,e):'<p class="muted">Pro tento zápas nemáme podporovaný předzápasový kurz a použitelný výpočet.</p>'}${missing.length?`<p class="small">Nenalezené trhy: ${esc(missing.join(', '))}.</p>`:''}<p class="small">Výsledek a porovnání týmů používají předpoklad nezávislých počtů. U trestů není ověřená shoda pravidel. Ani kladný rozdíl u těchto trhů není doporučení vsadit.</p></article>`;
 }).join(''):'<div class="panel">Pro tento den není v uložené nabídce žádný zápas.</div>';
}
function update(view){
 const selected=$('odds-date').value;data=view;
 const dates=[...new Set(data.events.map(e=>day(e.startTime)))].sort();
 $('odds-date').innerHTML=dates.map(d=>`<option value="${d}">${d.split('-').reverse().join('. ')}</option>`).join('');
 const today=day(new Date());if(dates.includes(selected))$('odds-date').value=selected;else if(dates.includes(today))$('odds-date').value=today;
 $('odds-receipt').textContent=`Archivováno ${stamp(data.capturedAt)}. Kontrolní otisk ${data.archiveSha256?.slice(0,12)??'dosud není'}…`;
 render();
}
async function refresh(){
 if(!serverAvailable||busy||document.hidden)return;
 busy=true;try{const response=await fetch('unavailable-server',{method:'POST',headers:{'X-Value-Lab':'refresh'}});
 if(!response.ok)throw Error('Server není dostupný.');const body=await response.json();
 serverInfo=`${body.reason??''} Spotřeba klienta za 31 dnů: ${body.usage.attempts31Days}/${body.usage.limit}.`;
 if(body.statistics)serverInfo+=` Statistiky: ${({ok:'aktualizováno',partial:'část detailů nedostupná',error:'aktualizace selhala, používáme uložená data',pending:'aktualizace probíhá',seed:'výchozí archiv'})[body.statistics.status]??'neznámý stav'}; rozpis načten ${stamp(body.statistics.retrievedAt)}.`;
 window.dispatchEvent(new Event('statistics-updated'));
 update(body.view);
 }catch{serverInfo='Aktualizace není dostupná; zobrazujeme poslední uloženou nabídku.';render();}finally{busy=false;}
}
async function init(){try{
 let view;try{const response=await fetch('unavailable-server');if(response.ok){const body=await response.json();view=body.view;serverAvailable=true;serverInfo=`Spotřeba klienta za 31 dnů: ${body.usage.attempts31Days}/${body.usage.limit}.`;}}catch{}
 if(!view){const response=await fetch('data/odds-view.json');if(!response.ok)throw Error('Načtené kurzy nejsou dostupné.');view=await response.json();}
 $('odds-date').addEventListener('change',render);$('odds-side').addEventListener('change',render);
 update(view);await refresh();setInterval(()=>{render();refresh();},5*60000);
}catch(error){$('odds-status').textContent=error.message;}}
init();
