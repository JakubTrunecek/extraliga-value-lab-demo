const markets={shots:'Střely celkem',shotsMore:'Více střel',goals:'Góly celkem',result60:'Výsledek po 60 minutách'};
const number=value=>Number.isFinite(value)?value.toLocaleString('cs-CZ',{maximumFractionDigits:1}):'—';

export function settlementClass(record){
 return record?.status==='settled'&&record.actual===1?'settlement-win':record?.status==='settled'&&record.actual===0?'settlement-loss':'';
}

export function settlementLabel(record){
 return record?.status==='settled'?(record.actual===1?'✓ Tip vyšel':'✕ Tip nevyšel'):record?.status==='pending'?'Čeká na ověřený výsledek':record?.status==='conflict'?'Rozpor zdrojů':record?.status==='no-pick'?(record.decisionReason==='filter'?'Před zápasem bez tipu':record.decisionReason?'Chyběla data pro tip':'Bez volby; důvod nerozlišen'):'Nelze vyhodnotit';
}

export function frozenPickText(record){
 const pick=record?.pick;if(!pick)return ({'missing-offer':'Chybí podporovaný kurz','missing-model':'Chybí použitelné modelové podklady',filter:'Bez tipu po kontrole filtrů'})[record?.decisionReason]??'Bez uložené volby – starší záznam nerozlišuje důvod';
 const side=pick.side==='over'?`více než ${number(pick.line)}`:pick.side==='under'?`méně než ${number(pick.line)}`:pick.side==='HOME'?record.home:pick.side==='AWAY'?record.away:'remíza';
 return `${markets[pick.market]??pick.market} · ${side} · kurz ${(Number.isFinite(pick.odds)?pick.odds.toLocaleString('cs-CZ',{maximumFractionDigits:2}):'—')}`;
}

export function settlementOutcome(record){
 if(record?.shotRange?.length===2)return `Střely ${record.shotRange.join('–')}`;
 if(Number.isInteger(record?.shotTotal))return `Střely ${record.shotTotal}`;
 if(record?.score?.length===2)return `${['shots','shotsMore'].includes(record.pick?.market)?'Střely za 60 minut':'Góly za 60 minut'} ${record.score.join(':')}`;
 return 'Ověřený výsledek';
}
