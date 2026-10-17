import {kickoff,pragueDate} from './scanner.js';
export function mergeScheduledMatches(events,fixtures,now=Date.now()){
 const result=events.map(e=>({...e,matchDate:pragueDate(new Date(e.startTime)),fixtureId:e.fixtureId??e.comparisons?.[0]?.fixtureId}));
 const from=pragueDate(new Date(now-7*86400000)),to=pragueDate(new Date(now+8*86400000));
 for(const f of fixtures){if(f.date<from||f.date>to)continue;const existing=result.find(e=>String(e.fixtureId)===String(f.id)&&e.matchDate===f.date);if(existing)continue;
 const start=kickoff(f);result.push({fixtureId:f.id,matchDate:f.date,startTime:start===null?null:new Date(start).toISOString(),home:f.homeName??f.home,away:f.awayName??f.away,comparisons:[],scheduleOnly:true,completed:f.completed===true});}
 return result;
}
