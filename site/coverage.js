const DAY=86400000;
const validScore=s=>Array.isArray(s)&&s.length===2&&s.every(n=>Number.isInteger(n)&&n>=0&&n<100);
const sameMatch=(a,b)=>String(a.fixtureId??a.id)===String(b.fixtureId??b.id)&&a.home===b.home&&a.away===b.away&&a.date===b.date;
// Audit is independent of a model choice. A game without a pick still counts.
export function auditFixtures(fixtures,records,games,conflictIds=[],now=Date.now()){
 const conflicts=new Set(conflictIds.map(String));
 const byId=new Map(records.map(r=>[String(r.fixtureId),r]));
 return fixtures.map(f=>{
  const r=byId.get(String(f.id)),exact=r&&sameMatch(r,f),start=f.startTime;
  const capture=Date.parse(r?.capturedAt),valid=exact&&!['legacy','invalid'].includes(r.status)&&Number.isFinite(capture)&&Number.isFinite(start)&&capture<start;
  const archiveStatus=!r?'absent':valid?(r.pick?'pick':'no-pick'):'invalid';
  const evidence=games.filter(g=>sameMatch(g,f)&&validScore(g.goals)&&(g.statisticsStatus==='zkontrolováno'||g.goalSource));
  const scores=evidence.map(g=>g.goals);
  if(exact&&r.status==='settled'&&['goals','result60'].includes(r.pick?.market)&&validScore(r.score))scores.push(r.score);
  if(exact&&r.quoteResults?.status==='settled'&&validScore(r.quoteResults.score))scores.push(r.quoteResults.score);
  const conflict=conflicts.has(String(f.id))||exact&&r.status==='conflict'||new Set(scores.map(s=>s.join(':'))).size>1;
  const resultStatus=conflict?'conflict':scores.length?'verified':'absent';
  return {fixtureId:f.id,round:f.round,date:f.date,time:f.time,startTime:start,home:f.homeName??f.home,away:f.awayName??f.away,archiveStatus,decisionReason:valid?r.decisionReason:null,resultStatus,score:resultStatus==='verified'?scores[0]:null,capturedAt:valid?r.capturedAt:null};
 });
}
export function auditState(row,now=Date.now()){
 const start=row.startTime,known=Number.isFinite(start),begun=known&&start<=now;
 const archive=row.archiveStatus==='absent'?(known?(begun?'missing':'waiting'):'unknown'):row.archiveStatus;
 const result=row.resultStatus!=='absent'?row.resultStatus:!known?'unknown':!begun?'upcoming':now-start<3*3600000?'live':'missing';
 const recovery=result==='missing'?(now-start<28*DAY?'automatic':'outside-window'):result==='unknown'?'missing-time':result==='conflict'?'review':'none';
 return {...row,archive,result,recovery};
}
export function auditRounds(rows,now=Date.now()){
 const groups=new Map();
 for(const row of rows){const key=String(row.round??'unknown');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(auditState(row,now));}
 return [...groups.entries()].map(([round,fixtures])=>{
  fixtures.sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.startTime??Infinity)-(b.startTime??Infinity));
  const count=fn=>fixtures.filter(fn).length;
  const saved=count(r=>['pick','no-pick'].includes(r.archive)),verified=count(r=>r.result==='verified');
  const gaps=count(r=>['missing','invalid','unknown'].includes(r.archive)||['missing','conflict','unknown'].includes(r.result));
  return {round,fixtures,total:fixtures.length,saved,verified,gaps,waiting:count(r=>r.archive==='waiting'||['upcoming','live'].includes(r.result)),complete:saved===fixtures.length&&verified===fixtures.length};
 }).sort((a,b)=>Number(b.round)-Number(a.round));
}
