const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const stamp=s=>new Date(s).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'});
const day=s=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
let data,serverAvailable=false,serverInfo='',busy=false;
function render(){
 if(!data)return;
 const date=$('odds-date').value,side=$('odds-side').value;
 const now=Date.now(),age=Math.max(0,Math.floor((now-Date.parse(data.retrievedAt))/60000));
 const events=data.events.filter(e=>day(e.startTime)===date);
 $('odds-status').textContent=`Načteno ${stamp(data.retrievedAt)} · stáří ${age} min · model ${data.modelVersion}. ${serverAvailable?'Automatická kontrola při otevřeném webu; PulseScore nejvýše jednou za 30 minut.':'Místní archiv; automatické načítání není dostupné.'} ${serverInfo}`;
 $('odds-context').textContent=age>15?'Uložená nabídka je starší než 15 minut. Kurzy mohou být jiné; slouží k prohlížení archivované analýzy.':'Nabídka byla právě načtená, ale poskytovatel neuvádí čas poslední změny cen. Shoda s aktuálním Tipsportem není ověřená.';
 $('odds-games').innerHTML=events.length?events.map(e=>{
 const started=Date.parse(e.startTime)<=now;
 const rows=e.rows.filter(r=>side==='all'||r.side===side).sort((a,b)=>a.line-b.line||a.side.localeCompare(b.side));
 return `<article class="panel"><div class="game-header"><div><p class="eyebrow">${esc(stamp(e.startTime))} · STŘELY ZA 60 MINUT</p><h2>${esc(e.home)} × ${esc(e.away)}</h2></div><span class="pill">${started?'Zápas již začal':'Výzkumný odhad'}</span></div>${e.rows.length?`<p>${started?'Zobrazený výpočet byl uložen před utkáním. Nejde o nabídku pro aktuální sázení.':'Na nových hranicích zatím nemáme nezávisle ověřenou výhodu. Ani kladný rozdíl sám není doporučením vsadit.'}</p><div class="table-wrap"><table><thead><tr><th>Hranice</th><th>Strana</th><th>Tipsport</th><th>Odhad šance</th><th>Férový kurz</th><th>Modelová výhoda</th><th>Po rezervě</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${num(r.line,1)}</td><td>${r.side==='over'?'Více než':'Méně než'}</td><td><strong>${num(r.odds)}</strong></td><td>${num(r.p*100,1)} %</td><td>${num(r.fair)}</td><td>${num(r.ev*100,1)} %</td><td>${num(r.conservativeEV*100,1)} %</td></tr>`).join('')}</tbody></table></div><p class="small">Modelová výhoda = odhad šance × kurz − 1. „Po rezervě“ používá spodní odhad citlivosti; nejde o garantovaný výnos ani statistický interval spolehlivosti.</p>`:'<p class="muted">V tomto snapshotu nejsou podporované střelecké kurzy. Dostupnost se může před začátkem změnit.</p>'}<div class="verdict warn">${e.rows.length?'Bez doporučení: nové hranice nejsou nezávisle ověřené a čas změny kurzu není známý.':'Chybí podporovaná nabídka. Žádné kurzy nedoplňujeme odhadem.'}</div></article>`;
 }).join(''):'<div class="panel">Pro tento den není v uložené nabídce žádný zápas.</div>';
}
function update(view){
 const selected=$('odds-date').value;data=view;
 const dates=[...new Set(data.events.map(e=>day(e.startTime)))].sort();
 $('odds-date').innerHTML=dates.map(d=>`<option value="${d}">${d.split('-').reverse().join('. ')}</option>`).join('');
 const today=day(new Date());if(dates.includes(selected))$('odds-date').value=selected;else if(dates.includes(today))$('odds-date').value=today;
 $('odds-receipt').textContent=`Archivováno ${stamp(data.capturedAt)}. Kontrolní otisk ${data.archiveSha256.slice(0,12)}…`;
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
