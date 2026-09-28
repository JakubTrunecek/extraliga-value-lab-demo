const node=document.getElementById('prospective-results');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{maximumFractionDigits:4}):'—';
let busy=false;
async function load(){if(busy)return;busy=true;try{
 const r=await fetch('unavailable-server');if(!r.ok)throw Error('Vyhodnocení je dostupné na hostovaném webu po přihlášení. Pokud se nenačte, úplné výsledky nyní nelze potvrdit.');
 const data=await r.json();
 node.innerHTML=`<p><strong>Vyhodnoceno ${data.settled} zápasů</strong> · čeká ${data.pending} · neplatné archivy ${data.invalid}</p><p>Brierovo skóre: <strong>${num(data.brier)}</strong> · ${data.lineCount} hranic. Nižší hodnota znamená přesnější pravděpodobnosti; 0 je bezchybný odhad. Samotné skóre nepotvrzuje výhodu oproti trhu.</p><p class="small">Každá hranice se počítá jednou přes over. Nejprve průměr uvnitř utkání, potom mezi utkáními. Více hranic jednoho zápasu není více nezávislých testů. Ziskovost ani ROI nevyhodnocujeme.</p>${data.fixtures.map(f=>`<details><summary>${esc(f.date)} · ${esc(f.home)} × ${esc(f.away)} · ${f.status==='settled'?'vyhodnoceno':f.status==='pending'?'čeká na potvrzené statistiky':'archiv neprošel kontrolou'}</summary><p class="small">První záznam: ${esc(f.capturedAt)} · otisk ${esc(f.archiveSha256?.slice(0,12)??'neuveden')}…</p>${f.status==='settled'?`<p>Střely za 60 minut ${f.shots.join(':')} · celkem ${f.total} · Brier ${num(f.brier)}</p><div class="table-wrap"><table><thead><tr><th>Over hranice</th><th>Uložená šance</th><th>Výsledek</th><th>Brier</th></tr></thead><tbody>${f.lines.map(l=>`<tr><td>${num(l.line)}</td><td>${num(l.p*100)} %</td><td>${l.actual?'Vyšlo':'Nevyšlo'}</td><td>${num(l.brier)}</td></tr>`).join('')}</tbody></table></div>`:''}</details>`).join('')}`;
 }catch(e){node.textContent=e.message;}finally{busy=false;}}
window.addEventListener('statistics-updated',load);load();
