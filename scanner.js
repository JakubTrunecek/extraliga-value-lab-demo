import {CONFIG,MARKETS,fit,predict,value} from './model.js';
export const DEFAULTS={minProbability:.65,minOdds:1.7,minEdge:.05,maxQuoteMinutes:15};
export function pragueDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function kickoff(f){if(!f.time)return null;const [y,m,d]=f.date.split('-').map(Number),[h,min]=f.time.split(':').map(Number);let utc=Date.UTC(y,m-1,d,h,min);const want=utc;for(let i=0;i<2;i++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(utc).map(p=>[p.type,p.value]));utc+=want-Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)}return utc}
export function isClosed(f,now=Date.now()){const start=kickoff(f);return f.completed||f.date<pragueDate(new Date(now))||(start!==null&&start<=now)}
export function validateFilters(f){if(!Number.isFinite(f.minProbability)||f.minProbability<.5||f.minProbability>.95||!Number.isFinite(f.minOdds)||f.minOdds<=1||f.minOdds>20)throw Error('Použij pravděpodobnost 50–95 % a minimální kurz větší než 1 až 20.');return f}
export function validateOffer(o){if(!MARKETS[o.market]||!['over','under'].includes(o.side)||!Number.isFinite(o.line)||o.line<.5||o.line>149.5||o.line%1!==.5||!Number.isFinite(o.odds)||o.odds<=1||o.odds>1000||typeof o.rulesConfirmed!=='boolean')throw Error('Zkontroluj trh, půlbodovou hranici a desetinný kurz větší než 1.');if(!Number.isFinite(Date.parse(o.observedAt)))throw Error('Chybí čas záznamu kurzu.');return o}
export function evaluateOffer(model,f,o,metrics,filters=DEFAULTS,now=Date.now(),lastDataDate){
 validateOffer(o);validateFilters(filters);const r=predict(model,f.home,f.away,o.line,o.side),ev=value(r.p,o.odds),conservativeEV=value(r.low,o.odds),reasons=[];
 if(isClosed(f,now))reasons.push('Zápas už skončil nebo začal.');
 if(!lastDataDate||Date.parse(f.date)-Date.parse(lastDataDate)>7*86400000)reasons.push('Podklady pro toto datum jsou příliš staré.');
 const age=now-Date.parse(o.observedAt);if(age>DEFAULTS.maxQuoteMinutes*60000||age< -60000)reasons.push('Kurz není čerstvý: ověř ho znovu.');
 if(!o.rulesConfirmed)reasons.push('Není potvrzená shoda pravidel trhu.');
 if(o.market==='penalties')reasons.push('Definice vyloučení není ověřená proti Tipsportu.');
 if(!metrics[o.market].validated||o.line!==CONFIG.lines[o.market])reasons.push('Pro tento trh a hranici chybí dostatečná historická opora.');
 if(r.p<filters.minProbability)reasons.push('Odhad šance je pod zvoleným minimem.');
 if(o.odds<filters.minOdds)reasons.push('Kurz je pod zvoleným minimem.');
 if(ev<=0)reasons.push('Kurz nepřevyšuje férovou cenu modelu.');
 if(conservativeEV<DEFAULTS.minEdge)reasons.push('Po započtení nejistoty nezůstává 5% rezerva.');
 return {...r,offer:o,ev,conservativeEV,reasons,eligible:reasons.length===0};
}
export function rankOffers(offers){return [...offers].sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.p-a.p||b.conservativeEV-a.conservativeEV)}
export function roundModels(history,date){const data=history.filter(g=>g.date<date);if(data.length<CONFIG.minGames)throw Error('Pro tento den nemáme dostatečnou historii.');return {models:Object.fromEntries(Object.keys(MARKETS).map(m=>[m,fit(data,m,date)])),lastDataDate:data.reduce((s,g)=>g.date>s?g.date:s,'')}}
