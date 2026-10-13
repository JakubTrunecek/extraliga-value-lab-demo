const HOUR=3600000;
const timestamp=(value,now)=>{const n=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(n)&&n<=now+60000?n:null;};
export function updateHealth(data,now=Date.now()){
 const rows=[],age=value=>{const t=timestamp(value,now);return t===null?Infinity:Math.max(0,now-t);};
 const oddsAt=data.freshness?.oddsAt, upcoming=(data.fixtureTimeline??[]).some(f=>Number.isFinite(f.startTime)&&f.startTime>now&&f.startTime<=now+72*HOUR);
 rows.push({label:'Kurzy',status:!Array.isArray(data.fixtureTimeline)?'Rozpis není dostupný':!upcoming?'Bez zápasu v příštích 72 hodinách':age(oddsAt)===Infinity?'Čas načtení není dostupný':age(oddsAt)>15*60000?'Archivní ceny · starší než 15 minut':'Ceny načtené v posledních 15 minutách',at:oddsAt,checkAt:data.automation?.prematch?.checkedAt,detail:'Poslední načtení cen. Dostupnost konkrétní nabídky ověř v Načtených kurzech. '+(data.automation?.prematch?.reason??'')});
 const audit=data.roundAudit, eligible=(audit??[]).filter(f=>Number.isFinite(f.startTime)&&now-f.startTime>=3*HOUR&&now-f.startTime<28*24*HOUR),pending=eligible.filter(f=>f.resultStatus!=='verified'),run=data.automation?.results,checked=run?.checkedAt;
 let status=!Array.isArray(audit)?'Kontrola úplnosti není dostupná':pending.length===0?'Žádný chybějící výsledek v automatickém okně':`${pending.length} zápasů čeká na ověření`;
 if(pending.length){if(run?.failureCode||run?.status==='error')status+=' · poslední kontrola selhala';else if(age(checked)>3*HOUR)status+=' · kontrola má zpoždění nebo chybí';else status+=' · kontrola proběhla';}
 rows.push({label:'Výsledky',status,at:checked,detail:'Poslední kontrola automatiky. '+(run?.reason??'Stav běhu zatím není uložený.'),resultAt:data.resultsUpdate?.checkedAt});
 if(Object.hasOwn(data,'publicSnapshotAt'))rows.push({label:'Přenos na veřejný web',at:data.publicSnapshotAt,status:age(data.publicSnapshotAt)===Infinity?'Čas přenosu není platný':age(data.publicSnapshotAt)>90*60000?'Přenos má zpoždění · přes 90 minut':'Přenos v posledních 90 minutách',detail:'Čas přenosu nepotvrzuje čerstvost kurzů ani výsledků. GitHub může plán odložit.'});
 return rows;
}
