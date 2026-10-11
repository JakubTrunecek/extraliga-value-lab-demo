import {matchPhase} from './settlement-ui.js';

// Only the immutable first choice is classified; never rerank after settlement.
export function performanceGroups(records,now=Date.now()){
 const active=records.filter(r=>r.status!=='legacy'&&['goals','result60'].includes(r.pick?.market));
 const tiers=['explore','reference'];
 if(active.some(r=>!tiers.includes(r.pick.tier)))tiers.push('unknown');
 return tiers.flatMap(tier=>['goals','result60'].map(market=>{
  const rows=active.filter(r=>r.pick.market===market&&(tier==='unknown'?!['explore','reference'].includes(r.pick.tier):r.pick.tier===tier));
  const settled=rows.filter(r=>r.status==='settled'&&[0,1].includes(r.actual));
  const paired=settled.filter(r=>[r.comparison?.modelBrier,r.comparison?.bookmakerBrier].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
  const avg=key=>paired.length?paired.reduce((sum,r)=>sum+r.comparison[key],0)/paired.length:null;
  const count=predicate=>rows.filter(predicate).length;
  const wins=settled.filter(r=>r.actual===1).length,losses=settled.length-wins;
  const upcoming=count(r=>r.status==='pending'&&matchPhase(r,now)==='upcoming');
  const live=count(r=>r.status==='pending'&&matchPhase(r,now)==='live');
  const waiting=count(r=>r.status==='pending'&&!['upcoming','live'].includes(matchPhase(r,now)));
  const conflicts=count(r=>r.status==='conflict');
  return {tier,market,total:rows.length,settled:settled.length,wins,losses,upcoming,live,waiting,conflicts,invalid:rows.length-settled.length-upcoming-live-waiting-conflicts,paired:paired.length,missing:settled.length-paired.length,modelBrier:avg('modelBrier'),bookmakerBrier:avg('bookmakerBrier')};
 }));
}
