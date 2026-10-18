import fs from 'node:fs';
import crypto from 'node:crypto';
const raw=fs.readFileSync(process.argv[2]);
const input=JSON.parse(raw.toString().replace(/^\uFEFF/,''));
const e=input.evaluation.threewayEvaluation;
const fail=m=>{throw Error(m)};
const near=(a,b,label)=>{if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-10)fail(label)};
const seen=new Set(),records=[];
for(const r of e.records){
 if(!r.fixtureId||!['settled','pending','conflict'].includes(r.status))fail('Invalid identity or state');
 const key=String(r.fixtureId);if(seen.has(key))fail('Duplicate fixture');seen.add(key);
 if(!(Date.parse(r.capturedAt)<Date.parse(r.startTime)))fail('Not prematch');
 if(r.status==='conflict'&&Array.isArray(r.rows)&&r.rows.length===0){if(!r.reason||['modelBrier','bookmakerBrier','modelLogLoss','bookmakerLogLoss'].some(k=>r[k]!==null))fail('Invalid conflict');continue;}
 if(r.rows.length!==3||new Set(r.rows.map(q=>q.side)).size!==3||r.rows.some(q=>!['HOME','DRAW','AWAY'].includes(q.side)))fail('Incomplete vector');
 if(r.rows.some(q=>!Number.isFinite(q.p)||q.p<=0||q.p>=1||!Number.isFinite(q.odds)||q.odds<=1))fail('Invalid vector');
 near(r.rows.reduce((s,q)=>s+q.p,0),1,'Probability sum');
 const margin=r.rows.reduce((s,q)=>s+1/q.odds,0);
 for(const q of r.rows)near(q.marketP,1/q.odds/margin,'Margin normalization');
 if(r.status!=='settled'){if(['modelBrier','bookmakerBrier','modelLogLoss','bookmakerLogLoss'].some(k=>r[k]!==null))fail('Unsettled score');continue;}
 if(!r.source||!Number.isFinite(Date.parse(r.checkedAt))||r.score.length!==2||r.score.some(x=>!Number.isInteger(x)||x<0))fail('Invalid result evidence');
 const actual=r.score[0]===r.score[1]?'DRAW':r.score[0]>r.score[1]?'HOME':'AWAY';
 const modelBrier=r.rows.reduce((s,q)=>s+(q.p-Number(q.side===actual))**2,0)/3;
 const bookmakerBrier=r.rows.reduce((s,q)=>s+(q.marketP-Number(q.side===actual))**2,0)/3;
 const winning=r.rows.find(q=>q.side===actual);
 const modelLogLoss=-Math.log(winning.p),bookmakerLogLoss=-Math.log(winning.marketP);
 for(const [k,v] of Object.entries({modelBrier,bookmakerBrier,modelLogLoss,bookmakerLogLoss}))near(r[k],v,k);
 records.push({fixtureId:r.fixtureId,date:r.date,home:r.home,away:r.away,score:r.score,modelBrier,bookmakerBrier,modelLogLoss,bookmakerLogLoss,delta:modelBrier-bookmakerBrier});
}
if(records.length!==e.settled||seen.size!==e.fixtures||e.records.filter(r=>r.status==='pending').length!==e.pending||e.records.filter(r=>r.status==='conflict').length!==e.conflicts)fail('Count mismatch');
const mean=(rows,k)=>rows.length?rows.reduce((s,r)=>s+r[k],0)/rows.length:null;
for(const k of ['modelBrier','bookmakerBrier','modelLogLoss','bookmakerLogLoss']){if(records.length)near(mean(records,k),e[k],'Aggregate '+k);else if(e[k]!==null)fail('Empty sample must have null losses');}
const settled=e.records.filter(r=>r.status==='settled');
for(const [key,values] of Object.entries({predictedDraw:settled.map(r=>r.rows.find(q=>q.side==='DRAW').p),marketDraw:settled.map(r=>r.rows.find(q=>q.side==='DRAW').marketP),observedDraw:settled.map(r=>Number(r.score[0]===r.score[1]))})){if(values.length)near(values.reduce((a,b)=>a+b,0)/values.length,e[key],key);else if(e[key]!==null)fail('Empty sample draw summary');}
const days=[...new Set(records.map(r=>r.date))].sort().map(date=>({date,games:records.filter(r=>r.date===date).length,delta:mean(records.filter(r=>r.date===date),'delta'),withoutDayDelta:mean(records.filter(r=>r.date!==date),'delta')}));
console.log(JSON.stringify({generatedAt:input.generatedAt,inputSha256:crypto.createHash('sha256').update(raw).digest('hex'),verified:true,fixtures:e.fixtures,settled:e.settled,pending:e.pending,conflicts:e.conflicts,modelBrier:mean(records,'modelBrier'),bookmakerBrier:mean(records,'bookmakerBrier'),delta:mean(records,'delta'),modelLogLoss:mean(records,'modelLogLoss'),bookmakerLogLoss:mean(records,'bookmakerLogLoss'),days,records,limitations:['Checks exported arithmetic, not authenticity of private archives or provider scores.','Does not verify training cutoff: private training evidence is absent from public export.','Leave-one-day-out sensitivity is descriptive, not a confidence interval or a new holdout.','No model fitting, provider calls or changes to original picks.']},null,2));
