// This ranks model signals for display. A positive model edge is not verified ROI.
export const tiers={
 strong:{order:3,label:'S rezervou',note:'Střely: modelový rozdíl zůstává kladný i po rezervě.'},
 watch:{order:2,label:'Možná value',note:'Střely: základní odhad je kladný, po rezervě už ne.'},
 explore:{order:1,label:'Průzkumný tip',note:'Výsledek, více střel nebo góly: historické ověření hodnoty kurzu zatím chybí.'}
};

export function tierFor(row){
 if(!row||![row.p,row.odds,row.ev].every(Number.isFinite)||row.p<.5||row.odds<1.5||row.odds>3.5)return null;
 if(row.market==='shots'&&row.rulesConfirmed&&row.ev>=.05&&Number.isFinite(row.conservativeEV)){
  return row.conservativeEV>0?'strong':'watch';
 }
 if(['result60','goals','shotsMore'].includes(row.market)&&row.ev>=.08)return 'explore';
 return null;
}

export function rankOpportunities(rows){
 return rows.map(row=>({row,tier:tierFor(row)})).filter(item=>item.tier)
  .sort((a,b)=>tiers[b.tier].order-tiers[a.tier].order||b.row.p-a.row.p||b.row.ev-a.row.ev);
}
