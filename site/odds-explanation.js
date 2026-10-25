export function rejectionReasons(row){
 if(!row)return ['Chybí použitelný odhad.'];
 const reasons=[];
 if(row.p<.5)reasons.push('Odhad šance je pod filtrem 50 %.');
 if(row.odds<1.5||row.odds>3.5)reasons.push('Kurz je mimo filtr 1,50–3,50.');
 if(row.ev<.08)reasons.push('Modelový rozdíl je pod filtrem +8 %.');
 return reasons;
}
