const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const validLoss=n=>Number.isFinite(n)&&n>=0&&n<=1;
// Descriptive summaries only: never fit parameters or treat lines as matches.
export function roundComparisons(data){
 const groups=[{id:'result60',label:'Výsledek po 60 minutách · úplný odhad',rows:(data.threewayEvaluation?.records??[]).map(r=>({...r,model:r.modelBrier,market:r.bookmakerBrier}))}];
 for(const tier of ['explore','reference'])groups.push({id:'goals-'+tier,label:'Góly · '+(tier==='explore'?'průzkumné tipy':'referenční volby'),rows:(data.frozenIdeas?.records??[]).filter(r=>r.pick?.market==='goals'&&r.pick.tier===tier&&r.status!=='legacy').map(r=>({...r,model:r.comparison?.modelBrier,market:r.comparison?.bookmakerBrier}))});
 const summarize=rows=>{
  const settled=rows.filter(r=>r.status==='settled'),paired=settled.filter(r=>validLoss(r.model)&&validLoss(r.market));
  const model=mean(paired.map(r=>r.model)),market=mean(paired.map(r=>r.market));
  return {total:rows.length,settled:settled.length,paired:paired.length,missing:settled.length-paired.length,pending:rows.filter(r=>r.status==='pending').length,issues:rows.filter(r=>!['settled','pending'].includes(r.status)).length,wins:settled.filter(r=>r.actual===1).length,losses:settled.filter(r=>r.actual===0).length,model,market,difference:paired.length?model-market:null};
 };
 return groups.map(({rows,...group})=>{
  const dates=[...new Set(rows.map(r=>r.date))].sort().reverse();
  const days=dates.map(date=>({date,...summarize(rows.filter(r=>r.date===date))}));
  const pairedDates=days.filter(d=>d.paired).map(d=>d.date);
  const leaveDayOut=pairedDates.length>1?pairedDates.map(date=>summarize(rows.filter(r=>r.date!==date)).difference):[];
  return {...group,...summarize(rows),days,pairedDays:pairedDates.length,sensitivity:leaveDayOut.length?{min:Math.min(...leaveDayOut),max:Math.max(...leaveDayOut)}:null};
 });
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?n.toLocaleString('cs-CZ',{maximumFractionDigits:4}):'—';
export function roundComparisonView(data){
 const groups=roundComparisons(data);
 return '<details class="panel"><summary>Po hracích dnech · model proti trhu</summary><p class="small">Automaticky z uložených předzápasových odhadů a ověřených výsledků. Výsledek po 60 minutách hodnotí celý odhad domácí / remíza / hosté. Góly hodnotí pouze původní vybranou stranu, odděleně podle typu volby; nejde o všechny archivované gólové hranice. Tyto dva typy Brier skóre nesrovnávej mezi sebou.</p>'+groups.map(g=>'<section><h3>'+esc(g.label)+'</h3><p>Srovnáno '+g.paired+' zápasů z '+g.pairedDays+' hracích dnů. Chybí úplné původní ceny: '+g.missing+'. Čeká na výsledek nebo začátek: '+g.pending+'. Rozpory / neplatné: '+g.issues+'.</p>'+(g.total?'<div class="table-wrap"><table><thead><tr><th>Den</th><th>Vyhodnoceno / uloženo</th>'+(g.id==='result60'?'':'<th>Vyšlo / nevyšlo</th>')+'<th>Srovnáno</th><th>Brier modelu ↓</th><th>Brier trhu ↓</th><th>Rozdíl ↓</th></tr></thead><tbody>'+g.days.map(d=>'<tr><td>'+esc(d.date)+'</td><td>'+d.settled+' / '+d.total+'</td>'+(g.id==='result60'?'':'<td>'+d.wins+' / '+d.losses+'</td>')+'<td>'+d.paired+'</td><td>'+num(d.model)+'</td><td>'+num(d.market)+'</td><td>'+num(d.difference)+'</td></tr>').join('')+'</tbody></table></div><p>Celkem na stejných zápasech: model '+num(g.model)+' · trh '+num(g.market)+' · rozdíl '+num(g.difference)+'.</p>':'<p>Zatím žádné uložené odhady v této skupině.</p>')+'<p class="small">'+(g.sensitivity?'Po vynechání vždy jednoho celého hracího dne je rozdíl '+num(g.sensitivity.min)+' až '+num(g.sensitivity.max)+'. '+(g.sensitivity.min<0&&g.sensitivity.max>0?'Pořadí modelu a trhu závisí na jednotlivém dni. ':''):'Citlivost na jednotlivý den zatím nelze určit: potřebujeme alespoň dva dny se srovnáním.')+'</p></section>').join('')+'<p class="small">Záporný rozdíl znamená menší chybu modelu na tomto vzorku. Každý zápas má stejnou váhu; čekání není prohra a pomlčka není nulová chyba. Rozpětí po vynechání dne není interval spolehlivosti ani důkaz výhody. Nehodnotí ziskovost. Ligový základ zde zatím není: nesmí se zpětně dopočítat z novějších dat.</p></details>';
}
