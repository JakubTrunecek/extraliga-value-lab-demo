// This ranks model signals for display. A positive model edge is not verified ROI.
export const tiers={
 strong:{order:3,label:'S rezervou',note:'Historický střelecký signál; tento trh je nyní pozastavený.'},
 watch:{order:2,label:'Možná value',note:'Historický střelecký signál; tento trh je nyní pozastavený.'},
 explore:{order:1,label:'Průzkumný tip',note:'Góly nebo výsledek po 60 minutách: hodnota proti kurzu zatím není prokázaná.'},
 reference:{order:0,label:'Nízká důvěra',note:'Neprošlo filtrem modelové hodnoty. Jen orientační volba; podle ní samotné nesázej.'}
};

export function tierFor(row){
 if(!row||![row.p,row.odds,row.ev].every(Number.isFinite)||row.p<.5||row.odds<1.5||row.odds>3.5)return null;
 if(['result60','goals'].includes(row.market)&&row.ev>=.08)return 'explore';
 return null;
}

export function rankOpportunities(rows){
 return rows.map(row=>({row,tier:tierFor(row)})).filter(item=>item.tier)
  .sort((a,b)=>tiers[b.tier].order-tiers[a.tier].order||b.row.p-a.row.p||b.row.ev-a.row.ev);
}

// Always show the best supported comparison when one exists, but never
// upgrade a weak or negative-edge row into a betting signal.
export function choiceForGame(rows){
 const signal=rankOpportunities(rows)[0];if(signal)return signal;
 const reference=rows.filter(row=>['goals','result60'].includes(row.market)
  &&[row.p,row.odds,row.ev].every(Number.isFinite)&&row.p>=.35&&row.p<=1&&row.odds>=1.5&&row.odds<=5)
  .sort((a,b)=>b.ev-a.ev||b.p-a.p||a.odds-b.odds)[0];
 return reference?{row:reference,tier:'reference'}:null;
}
