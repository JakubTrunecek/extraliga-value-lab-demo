// Fixed before opening the 2026-09-27 holdout. No outcome-dependent tuning.
export const CONFIG=Object.freeze({version:'1.0.0',halfLifeDays:120,priorGames:12,iterations:35,minGames:140,cutoff:'2026-09-27',lines:{goals:5.5,shots:55.5,penalties:7.5},uncertaintyZ:1.28,minEdge:0.05});
export const MARKETS={goals:{label:'Góly',scope:'Základní doba · 60 minut'},shots:{label:'Střely na branku',scope:'Základní doba · 60 minut'},penalties:{label:'Vyloučení',scope:'Údaj Hokej.cz za celý zápas · experimentální'}};
export function validPair(v){return Array.isArray(v)&&v.length===2&&v.every(x=>Number.isInteger(x)&&x>=0&&x<300)}
export function fit(history,market,asOf){
 if(!MARKETS[market]||!/^\d{4}-\d{2}-\d{2}$/.test(asOf))throw Error('Neplatný trh nebo datum.');
 // Strict day boundary: a match from the same day is never used.
 const eligible=history.filter(g=>g.date<asOf&&validPair(g[market]));
 if(eligible.length<CONFIG.minGames)throw Error('Pro model je potřeba alespoň 140 ověřených historických zápasů.');
 // Relative to latest observation: offseason does not erase all learned strength.
 const anchor=Math.max(...eligible.map(g=>Date.parse(g.date)));
 const rows=eligible.map(g=>({...g,w:2**(-(anchor-Date.parse(g.date))/86400000/CONFIG.halfLifeDays)}));
 const teams=[...new Set(rows.flatMap(g=>[g.home,g.away]))].sort();
 const sw=rows.reduce((s,g)=>s+g.w,0);
 let bh=rows.reduce((s,g)=>s+g.w*g[market][0],0)/sw,ba=rows.reduce((s,g)=>s+g.w*g[market][1],0)/sw;
 const avg=(bh+ba)/2,prior=CONFIG.priorGames*Math.max(avg,.1);
 const attack=Object.fromEntries(teams.map(t=>[t,1])),defense={...attack},counts=Object.fromEntries(teams.map(t=>[t,0]));
 rows.forEach(g=>{counts[g.home]+=g.w;counts[g.away]+=g.w});
 const obs=Object.fromEntries(teams.map(t=>[t,0])),conceded={...obs};
 rows.forEach(g=>{obs[g.home]+=g.w*g[market][0];obs[g.away]+=g.w*g[market][1];conceded[g.home]+=g.w*g[market][1];conceded[g.away]+=g.w*g[market][0]});
 for(let it=0;it<CONFIG.iterations;it++){
  const exposure=Object.fromEntries(teams.map(t=>[t,0]));
  for(const g of rows){exposure[g.home]+=g.w*bh*defense[g.away];exposure[g.away]+=g.w*ba*defense[g.home]}
  for(const t of teams)attack[t]=(obs[t]+prior)/(exposure[t]+prior);
  const dexp=Object.fromEntries(teams.map(t=>[t,0]));
  for(const g of rows){dexp[g.away]+=g.w*bh*attack[g.home];dexp[g.home]+=g.w*ba*attack[g.away]}
  for(const t of teams)defense[t]=(conceded[t]+prior)/(dexp[t]+prior);
 }
 let residual=0,den=0;
 for(const g of rows){const mu=bh*attack[g.home]*defense[g.away]+ba*attack[g.away]*defense[g.home];const y=g[market][0]+g[market][1];residual+=g.w*((y-mu)**2-mu);den+=g.w*mu*mu}
 // Moment-estimated NB dispersion, shrunk towards Poisson with 30 pseudo-games.
 const alpha=Math.max(0,Math.min(1,residual/den))*sw/(sw+30);
 return {market,asOf,teams,attack,defense,counts,avg,bh,ba,alpha,sw,n:rows.length,from:rows[0].date,to:new Date(anchor).toISOString().slice(0,10)};
}
export function distribution(mu,alpha=0){
 if(!Number.isFinite(mu)||mu<=0||mu>500||!Number.isFinite(alpha)||alpha<0)throw Error('Neplatný parametr rozdělení.');
 const out=[],poisson=alpha<1e-5,r=poisson?Infinity:1/alpha,p=poisson?0:r/(r+mu);
 let pk=poisson?Math.exp(-mu):Math.exp(r*Math.log(p)),sum=0;
 for(let k=0;k<3000;k++){
  out.push(pk);sum+=pk;
  if(k>mu+12*Math.sqrt(mu+alpha*mu*mu)&&sum>1-1e-10)break;
  pk*=poisson?mu/(k+1):(k+r)/(k+1)*(1-p);
 }
 return out.map(x=>x/sum);
}
export function probability(pmf,line,side){
 if(!Number.isFinite(line)||line<.5||line>149.5||Math.abs(line%1-.5)>1e-9||!['over','under'].includes(side))throw Error('Použij půlbodovou hranici (např. 5,5). Celé hranice s vrácením vkladu zatím nepodporujeme.');
 const under=pmf.reduce((s,p,k)=>s+(k<line?p:0),0);return Math.max(0,Math.min(1,side==='under'?under:1-under));
}
export function predict(model,home,away,line,side='over'){
 if(home===away||!model.teams.includes(home)||!model.teams.includes(away))throw Error('Vyber dva různé týmy z historických dat.');
 const mh=model.bh*model.attack[home]*model.defense[away],ma=model.ba*model.attack[away]*model.defense[home],mu=mh+ma;
 const pmf=distribution(mu,model.alpha),p=probability(pmf,line,side);
 // Sensitivity band, NOT a calibrated confidence interval. Ignores lineup uncertainty.
 const se=Math.sqrt((1+model.alpha*mu)/(model.avg*(Math.min(model.counts[home],model.counts[away])+CONFIG.priorGames)));
 const shift=CONFIG.uncertaintyZ*se;
 const bounds=[probability(distribution(mu*Math.exp(-shift),model.alpha),line,side),probability(distribution(mu*Math.exp(shift),model.alpha),line,side)].sort((a,b)=>a-b);
 return {market:model.market,home,away,line,side,mu,mh,ma,p,pmf,low:bounds[0],high:bounds[1],fair:1/p,buffered:1.05/bounds[0],n:model.n,effectiveHome:model.counts[home],effectiveAway:model.counts[away],alpha:model.alpha};
}
export function value(p,odds){if(!Number.isFinite(p)||p<0||p>1||!Number.isFinite(odds)||odds<=1||odds>1000)throw Error('Kurz musí být větší než 1 a nejvýše 1000.');return p*odds-1}
export function assess(result,odds,rulesConfirmed,validated){
 if(result.market==='penalties')return {status:'experimental',text:'Vyloučení jsou experimentální. Definice Hokej.cz není ověřena proti vyhodnocení Tipsportu; sázkový signál je vypnutý.'};
 if(odds===null)return {status:'missing',text:'Zadej skutečný kurz Tipsportu. Zatím jde pouze o odhad férové ceny.'};
 const ev=value(result.p,odds),lowEV=value(result.low,odds);
 if(!rulesConfirmed)return {status:'rules',ev,lowEV,text:'Potvrď shodu trhu: celý zápas v základní době, stejná hranice a stejná statistika.'};
 if(!validated)return {status:'unvalidated',ev,lowEV,text:'Pouze průzkumný výpočet. Model v historickém testu nepřekonal ligový průměr nebo nemá dost ověření; sázkový signál je vypnutý.'};
 if(ev<=0)return {status:'negative',ev,lowEV,text:'Kurz je podle modelu příliš nízký. Odhadovaná výhoda není kladná.'};
 if(lowEV<CONFIG.minEdge)return {status:'fragile',ev,lowEV,text:'Kladný bodový odhad, ale malá rezerva vůči nejistotě. Kandidát neprošel konzervativním filtrem.'};
 return {status:'candidate',ev,lowEV,text:'Kandidát k dalšímu ověření. I při snížení odhadu zůstává alespoň 5% modelová rezerva. Není to prokázaná ziskovost.'};
}
