export const monitorWindow=Object.freeze({id:'calibration-monitor-20261025-v1',from:'2026-10-25',through:'2026-11-30'});
// Read-only coverage of the known schedule, not an external calendar audit.
export function windowReadiness(input,protocol){
 const now=Date.parse(input.generatedAt),e=input.evaluation;
 if(!Number.isFinite(now))throw Error('Invalid snapshot time');
 if(!Array.isArray(e?.roundAudit)||!e.roundAudit.length)return {available:false,reason:'Known schedule audit is unavailable; coverage cannot be confirmed.'};
 const unique=rows=>{const map=new Map();for(const r of rows){const id=String(r.fixtureId??'');if(!id||map.has(id))throw Error('Missing or duplicate fixture in readiness input');map.set(id,r);}return map;};
 const schedule=unique(e.roundAudit),goals=Array.isArray(e.goalEvaluation?.records)?unique(e.goalEvaluation.records):null,result60=Array.isArray(e.threewayEvaluation?.records)?unique(e.threewayEvaluation.records):null;
 const inWindow=r=>r.date>=protocol.from&&r.date<=protocol.through;
 const assess=(map,f)=>{
  if(!map)return 'unavailable';
  const r=map.get(String(f.fixtureId));
  if(!r)return Number.isFinite(f.startTime)?(f.startTime>now?'waiting-capture':'missing-capture'):'unknown-start';
  if(r.status==='conflict'||r.status==='invalid')return 'rejected';
  if(!['settled','pending'].includes(r.status)||r.date!==f.date||!Number.isFinite(f.startTime)||Date.parse(r.startTime)!==f.startTime||!(Date.parse(r.capturedAt)<f.startTime&&Date.parse(r.capturedAt)<=now))return 'identity-or-time-mismatch';
  if(f.resultStatus==='conflict')return 'result-conflict';
  if(r.status==='settled'){
   if(f.resultStatus!=='verified'||JSON.stringify(r.score)!==JSON.stringify(f.score))return 'result-mismatch';
   return 'settled';
  }
  if(f.resultStatus==='verified')return 'evaluation-lag';
  return f.startTime>now?'ready-prematch':now-f.startTime<3*3600000?'in-progress-by-schedule':'waiting-result';
 };
 const rows=[...schedule.values()].filter(inWindow).map(f=>({fixtureId:f.fixtureId,date:f.date,home:f.home,away:f.away,startTime:f.startTime,archiveStatus:f.archiveStatus,resultStatus:f.resultStatus,goals:assess(goals,f),result60:assess(result60,f)}));
 const count=items=>Object.fromEntries(['goals','result60'].map(m=>[m,items.reduce((a,r)=>(a[r[m]]=(a[r[m]]??0)+1,a),{})]));
 const horizon=[...schedule.values()].map(r=>r.date).filter(d=>typeof d==='string').sort().at(-1)??null;
 const orphans=Object.fromEntries([['goals',goals],['result60',result60]].map(([market,map])=>[market,map?[...map.values()].filter(r=>inWindow(r)&&!schedule.has(String(r.fixtureId))).map(r=>r.fixtureId):null]));
 return {available:true,knownFixtures:rows.length,knownScheduleThrough:horizon,windowEndRepresented:horizon!==null&&horizon>=protocol.through,counts:count(rows),days:[...new Set(rows.map(r=>r.date))].sort().map(date=>{const selected=rows.filter(r=>r.date===date);return {date,fixtures:selected.length,counts:count(selected)};}),recordsOutsideKnownSchedule:orphans,rows,limitation:'Only the exported known schedule is checked. Reaching the end date does not prove calendar completeness. Waiting for future capture is not failure; no-pick is not missing evidence. Full team identity/provenance still requires private archive checks.'};
}
