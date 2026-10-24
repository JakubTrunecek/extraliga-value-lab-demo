import test from 'node:test';import assert from 'node:assert/strict';
import {auditGoalsPublic} from './audit-goals-public.mjs';
function sample(){
 const row=(line,p)=>{const actual=Number(5>line);return {line,side:'over',p,odds:2,underOdds:2,marketP:.5,actual,modelBrier:(p-actual)**2,bookmakerBrier:.25};};
 const r={fixtureId:'1',home:'SPA',away:'KVA',date:'2026-10-23',capturedAt:'2026-10-21T10:00:00Z',startTime:'2026-10-23T15:00:00Z',checkedAt:'2026-10-23T18:00:00Z',source:'stored regulation result',status:'settled',score:[3,2],rows:[row(4.5,.6),row(5.5,.6)],modelBrier:.26,bookmakerBrier:.25};
 const other={...structuredClone(r),fixtureId:'2',rows:[row(4.5,.6)],modelBrier:.16};
 return {generatedAt:'2026-10-23T19:00:00Z',evaluation:{goalEvaluation:{records:[r,other],fixtures:2,settled:2,pending:0,conflicts:0,rejected:0,modelBrier:.21,bookmakerBrier:.25}}};
}
test('independent averages give matches equal weight despite different line counts',()=>{const s=sample(),before=JSON.stringify(s);assert.equal(auditGoalsPublic(s).lines,3);assert.equal(JSON.stringify(s),before);s.evaluation.goalEvaluation.modelBrier=(.16+.36+.16)/3;assert.throws(()=>auditGoalsPublic(s),/equal-fixture/);});
for(const [name,change] of [
 ['price pair',e=>delete e.records[0].rows[0].underOdds],['margin',e=>e.records[0].rows[0].marketP=.7],['probability',e=>e.records[0].rows[0].p=2],['line outcome',e=>e.records[0].rows[0].actual=0],['line loss',e=>e.records[0].rows[0].modelBrier=0],['fixture loss',e=>e.records[0].modelBrier=0],['aggregate',e=>e.modelBrier=0],['duplicate fixture',e=>e.records.push(e.records[0])],['duplicate line',e=>e.records[0].rows.push(e.records[0].rows[0])],['integer boundary',e=>e.records[0].rows[0].line=5],['late capture',e=>e.records[0].capturedAt=e.records[0].startTime],['future result',e=>e.records[0].checkedAt='2026-10-25'],['source',e=>e.records[0].source=''],['score',e=>e.records[0].score=[3.5,2]],['counts',e=>e.pending=1],['unknown state',e=>e.records[0].status='won']
])test('rejects '+name,()=>{const s=sample();change(s.evaluation.goalEvaluation);assert.throws(()=>auditGoalsPublic(s));});
for(const state of ['pending','conflict','invalid'])test(state+' stays unscored',()=>{
 const s=sample(),e=s.evaluation.goalEvaluation;e.records=e.records.slice(0,1);e.fixtures=1;e.settled=0;e.pending=Number(state==='pending');e.conflicts=Number(state==='conflict');e.rejected=Number(state==='invalid');e.modelBrier=e.bookmakerBrier=null;
 const r=e.records[0];r.status=state;r.reason='missing or conflicting evidence';delete r.score;r.modelBrier=r.bookmakerBrier=null;for(const q of r.rows){delete q.actual;delete q.modelBrier;delete q.bookmakerBrier;}if(state==='invalid')r.rows=[];
 assert.equal(auditGoalsPublic(s).settled,0);r.modelBrier=0;assert.throws(()=>auditGoalsPublic(s),/unsettled/);
});
test('missing section fails while explicitly empty sample with null losses passes',()=>{assert.throws(()=>auditGoalsPublic({generatedAt:'2026-10-23'}));const s=sample(),e=s.evaluation.goalEvaluation;e.records=[];e.fixtures=e.settled=0;e.modelBrier=e.bookmakerBrier=null;assert.equal(auditGoalsPublic(s).settled,0);e.modelBrier=0;assert.throws(()=>auditGoalsPublic(s));});

test('independent baseline arithmetic and paired comparison are validated',()=>{
 const s=sample(),e=s.evaluation.goalEvaluation;
 for(const r of e.records){r.leagueBaseline={status:'available',method:'archived-league-poisson-v1',halfLifeDays:120,games:160,trainingBeforeDate:r.date,expected:5};
 for(const q of r.rows){let p=Math.exp(-5),sum=p;for(let k=1;k<=Math.floor(q.line);k++){p*=5/k;sum+=p;}q.baselineP=1-sum;q.baselineBrier=(q.baselineP-q.actual)**2;}
 r.baselineBrier=r.rows.reduce((s,q)=>s+q.baselineBrier,0)/r.rows.length;}
 e.leagueComparison={fixtures:2,missing:0,modelBrier:.21,bookmakerBrier:.25,baselineBrier:e.records.reduce((s,r)=>s+r.baselineBrier,0)/2};assert.equal(auditGoalsPublic(s).leagueComparison.fixtures,2);
 for(const change of [e=>e.records[0].rows[0].baselineP=.1,e=>e.leagueComparison.baselineBrier=0,e=>e.leagueComparison.fixtures=1,e=>e.records[0].baselineBrier=0]){const b=structuredClone(s);change(b.evaluation.goalEvaluation);assert.throws(()=>auditGoalsPublic(b));}
});
