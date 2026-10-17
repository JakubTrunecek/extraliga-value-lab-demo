const nativeFetch=globalThis.fetch.bind(globalThis);let cached,loadedAt=0,inflight;
async function snapshot(){
 if(cached&&Date.now()-loadedAt<30000)return cached;
 if(inflight)return inflight;
 inflight=(async()=>{try{const r=await nativeFetch('data/live.json',{cache:'no-store'});if(!r.ok)throw Error('Přenos dat není dostupný.');const data=await r.json();if(data.schemaVersion!==1||data.readOnly!==true||!Number.isFinite(Date.parse(data.generatedAt))||Date.parse(data.generatedAt)>Date.now()+60000)throw Error('Neplatný přenos dat.');cached=data;loadedAt=Date.now();const el=document.getElementById('pages-sync');if(el){const age=Date.now()-Date.parse(data.generatedAt);el.textContent='Přeneseno '+new Date(data.generatedAt).toLocaleString('cs-CZ',{timeZone:'Europe/Prague'})+' · '+(age>90*60000?'Přenos má zpoždění. Zobrazená data mohou být zastaralá.':'Plán požaduje přenos každých 30 minut, GitHub jej může odložit i o hodiny. Rozhodující je čas přenosu; stáří kurzů je uvedené zvlášť.');}return data;}catch(e){const el=document.getElementById('pages-sync');if(el)el.textContent='Přenos dat se nepodařilo obnovit. Zobrazený přehled nemusí být aktuální.';throw e;}finally{inflight=null;}})();return inflight;
}
export async function appFetch(path,options={}){
 if(options.method&&options.method!=='GET')throw Error('Veřejný přehled nepovoluje zápis ani načítání od poskytovatele.');
 const key={'/api/odds':'odds','/api/data':'data','/api/evaluation':'evaluation'}[path];
 if(key){const data=await snapshot();return Response.json(key==='evaluation'?{...data[key],freshness:{oddsAt:data.odds?.view?.retrievedAt??null},publicSnapshotAt:data.generatedAt}:data[key]);}
 if(typeof path!=='string'||path.startsWith('/')||path.includes('..')||/^[a-z]+:/i.test(path))throw Error('Nepovolená adresa.');
 return nativeFetch(path,options);
}
setInterval(()=>{if(!document.hidden)window.dispatchEvent(new Event('statistics-updated'));},60000);
