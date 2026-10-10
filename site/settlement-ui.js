const markets={shots:'Střely celkem',shotsMore:'Více střel',goals:'Góly celkem',result60:'Výsledek po 60 minutách'};
const number=value=>Number.isFinite(value)?value.toLocaleString('cs-CZ',{maximumFractionDigits:1}):'—';

export function settlementClass(record){
 return record?.status==='settled'&&record.actual===1?'settlement-win':record?.status==='settled'&&record.actual===0?'settlement-loss':'';
}

export function settlementLabel(record){
 return record?.status==='settled'?(record.actual===1?'✓ Tip vyšel':'✕ Tip nevyšel'):record?.status==='pending'?(matchPhase(record)==='unknown'?'Čeká na ověřený výsledek':phaseLabel(matchPhase(record))):record?.status==='conflict'?'Rozpor zdrojů':record?.status==='no-pick'?(record.decisionReason==='filter'?'Před zápasem bez tipu':record.decisionReason?'Chyběla data pro tip':'Bez volby; důvod nerozlišen'):'Nelze vyhodnotit';
}

export function frozenPickText(record){
 const pick=record?.pick;if(!pick)return ({'missing-archive':'Chybí předzápasový záznam; tip zpětně nevytváříme','missing-offer':'Chybí podporovaný kurz','missing-model':'Chybí použitelné modelové podklady',filter:'Bez tipu po kontrole filtrů'})[record?.decisionReason]??'Bez uložené volby – starší záznam nerozlišuje důvod';
 const side=pick.side==='over'?`více než ${number(pick.line)}`:pick.side==='under'?`méně než ${number(pick.line)}`:pick.side==='HOME'?record.home:pick.side==='AWAY'?record.away:'remíza';
 return `${markets[pick.market]??pick.market} · ${side} · kurz ${(Number.isFinite(pick.odds)?pick.odds.toLocaleString('cs-CZ',{maximumFractionDigits:2}):'—')}`;
}

export function settlementOutcome(record){
 if(record?.shotRange?.length===2)return `Střely ${record.shotRange.join('–')}`;
 if(Number.isInteger(record?.shotTotal))return `Střely ${record.shotTotal}`;
 if(record?.score?.length===2)return `${['shots','shotsMore'].includes(record.pick?.market)?'Střely za 60 minut':'Góly za 60 minut'} ${record.score.join(':')}`;
 return 'Ověřený výsledek';
}

// Clock-derived phase is an estimate, never a live score or evidence of a final result.
export function matchPhase(record,now=Date.now()){
 if(record?.status==='settled'||record?.quoteResults?.status==='settled')return 'finished';
 const start=typeof record?.startTime==='number'?record.startTime:Date.parse(record?.startTime);
 if(record?.completed)return 'waiting';
 if(!Number.isFinite(start))return 'unknown';
 if(now<start)return 'upcoming';
 return now-start<3*3600000?'live':'waiting';
}
export const phaseLabel=phase=>({upcoming:'Před zápasem',live:'Probíhá podle rozpisu',waiting:'Čeká na ověřený výsledek',finished:'Vyhodnoceno',unknown:'Čas začátku není ověřen'}[phase]);
export function timelineRecords(data){
 const fixtures=new Map((data.fixtureTimeline??[]).map(f=>[String(f.fixtureId),f]));
 const records=(data.frozenIdeas?.records??[]).map(r=>({...fixtures.get(String(r.fixtureId)),...r}));
 const existing=new Set(records.map(r=>String(r.fixtureId)));
 return [...records,...[...fixtures.values()].filter(f=>!existing.has(String(f.fixtureId))).map(f=>({...f,status:'missing',pick:null,decisionReason:'missing-archive'}))];
}
