import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Independent of the production evaluator. This checks public arithmetic only.
export function auditGoalsPublic(input){
 const fail=message=>{throw Error('Goal audit: '+message);};
 const require=(condition,message)=>{if(!condition)fail(message);};
 const near=(a,b,message)=>require(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10,message);
 const e=input?.evaluation?.goalEvaluation,generated=Date.parse(input?.generatedAt);
 require(Number.isFinite(generated),'missing snapshot time');
 require(e&&Array.isArray(e.records),'missing goal evaluation');
 const seen=new Set(),settled=[];let lines=0;
 for(const r of e.records){
  require(r&&['string','number'].includes(typeof r.fixtureId)&&String(r.fixtureId).length>0,'missing fixture');
  const id=String(r.fixtureId);require(!seen.has(id),'duplicate fixture');seen.add(id);
  require(['settled','pending','conflict','invalid'].includes(r.status),'unknown state');
  require(Array.isArray(r.rows),'missing rows');
  if(r.status!=='settled'){
   require(r.modelBrier===null&&r.bookmakerBrier===null,'unsettled fixture has a score');
   require(r.score==null,'unsettled result');
   require(r.rows.every(q=>q.actual==null&&q.modelBrier==null&&q.bookmakerBrier==null),'unsettled line has a score');
  }
  // Invalid evidence remains visible, never repairs itself into a scored record.
  if(r.status==='invalid'||r.status==='conflict'&&r.rows.length===0){
   require(typeof r.reason==='string'&&r.reason.length>0&&r.rows.length===0,'invalid exclusion');continue;
  }
  const capture=Date.parse(r.capturedAt),start=Date.parse(r.startTime);
  require(Number.isFinite(capture)&&Number.isFinite(start)&&capture<start&&capture<=generated,'not a saved prematch estimate');
  require(typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&typeof r.home==='string'&&typeof r.away==='string'&&r.home!==r.away,'invalid fixture identity');
  require(r.rows.length>0,'empty valid set');
  const boundaries=new Set();let model=0,market=0;
  if(r.status==='settled'){
   require(start<=generated&&Array.isArray(r.score)&&r.score.length===2&&r.score.every(n=>Number.isInteger(n)&&n>=0),'invalid regulation score');
   require(typeof r.source==='string'&&r.source.length>0,'missing result source');
   if(r.checkedAt!=null)require(Number.isFinite(Date.parse(r.checkedAt))&&Date.parse(r.checkedAt)<=generated,'future or invalid result timestamp');
  }
  for(const q of r.rows){
   require(Number.isFinite(q.line)&&q.line>=0&&q.line%1===.5&&!boundaries.has(q.line),'invalid or duplicate line');boundaries.add(q.line);
   require(q.side==='over'&&Number.isFinite(q.p)&&q.p>=0&&q.p<=1,'invalid probability or side');
   require([q.odds,q.underOdds].every(x=>Number.isFinite(x)&&x>1&&x<=1000),'missing or invalid price pair');
   const marketP=(1/q.odds)/(1/q.odds+1/q.underOdds);near(q.marketP,marketP,'margin normalization');
   if(r.status==='settled'){
    const y=Number(r.score[0]+r.score[1]>q.line);require(q.actual===y,'wrong line outcome');
    const a=(q.p-y)**2,b=(marketP-y)**2;near(q.modelBrier,a,'model line loss');near(q.bookmakerBrier,b,'market line loss');model+=a;market+=b;
   }
  }
  if(r.status==='settled'){near(r.modelBrier,model/r.rows.length,'fixture model average');near(r.bookmakerBrier,market/r.rows.length,'fixture market average');settled.push({model:model/r.rows.length,market:market/r.rows.length});lines+=r.rows.length;}
 }
 for(const [key,value] of Object.entries({fixtures:e.records.length,settled:settled.length,pending:e.records.filter(r=>r.status==='pending').length,conflicts:e.records.filter(r=>r.status==='conflict').length,rejected:e.records.filter(r=>r.status==='invalid').length}))require(e[key]===value,'count '+key);
 if(settled.length){near(e.modelBrier,settled.reduce((s,r)=>s+r.model,0)/settled.length,'equal-fixture model average');near(e.bookmakerBrier,settled.reduce((s,r)=>s+r.market,0)/settled.length,'equal-fixture market average');}
 else require(e.modelBrier===null&&e.bookmakerBrier===null,'empty sample needs null losses');

 // New baseline section is optional for historical publications. Once present,
 // every baseline probability, loss and paired aggregate must be consistent.
 if(e.leagueComparison){
  const paired=[];
  for(const r of e.records){
   const b=r.leagueBaseline;
   require(b&&['available','unavailable'].includes(b.status),'baseline state');
   if(b.status==='available')require(b.method==='archived-league-poisson-v1'&&b.halfLifeDays===120&&Number.isInteger(b.games)&&b.games>=140&&b.trainingBeforeDate===r.date&&Number.isFinite(b.expected)&&b.expected>0&&b.expected<=500,'baseline protocol');
   let loss=0;
   for(const q of r.rows){
    if(b.status==='available'){
     require(q.line<=149.5,'baseline line range');
     let term=Math.exp(-b.expected),cdf=term;
     for(let k=1;k<=Math.floor(q.line);k++){term=term*b.expected/k;cdf+=term;}
     const p=Math.max(0,Math.min(1,1-cdf));near(q.baselineP,p,'baseline Poisson probability');
     if(r.status==='settled'){const l=(p-q.actual)**2;near(q.baselineBrier,l,'baseline line loss');loss+=l;}else require(q.baselineBrier==null,'unsettled baseline loss');
    }else require(q.baselineP==null&&q.baselineBrier==null,'unavailable baseline');
   }
   if(r.status==='settled'&&b.status==='available'){near(r.baselineBrier,loss/r.rows.length,'baseline fixture loss');paired.push(r);}
   else require(r.baselineBrier===null,'unscored baseline fixture');
  }
  const b=e.leagueComparison;require(b.fixtures===paired.length&&b.missing===settled.length-paired.length,'baseline paired counts');
  for(const key of ['modelBrier','bookmakerBrier','baselineBrier']){if(paired.length)near(b[key],paired.reduce((s,r)=>s+r[key],0)/paired.length,'baseline paired '+key);else require(b[key]===null,'empty baseline comparison');}
 }
 return {verified:true,leagueComparison:e.leagueComparison??null,fixtures:e.fixtures,settled:e.settled,lines,pending:e.pending,conflicts:e.conflicts,rejected:e.rejected,modelBrier:e.modelBrier,bookmakerBrier:e.bookmakerBrier,limitation:'Arithmetic and public consistency only; not proof of source authenticity, training cutoff or profitability.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw Error('Usage: node audit-goals-public.mjs live.json');
 console.log(JSON.stringify(auditGoalsPublic(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''))),null,2));
}
