const themeKey='value-lab-theme';
const scheme=window.matchMedia('(prefers-color-scheme: dark)');
function savedTheme(){try{const value=localStorage.getItem(themeKey);return value==='dark'||value==='light'?value:null}catch{return null}}
function applyTheme(theme){
 document.documentElement.dataset.theme=theme;
 const button=document.getElementById('theme-toggle');
 if(button){button.textContent=theme==='dark'?'☀ Světlý režim':'☾ Tmavý režim';button.setAttribute('aria-label',theme==='dark'?'Zapnout světlý režim':'Zapnout tmavý režim');button.setAttribute('aria-pressed',String(theme==='dark'))}
}
applyTheme(savedTheme()??(scheme.matches?'dark':'light'));
document.addEventListener('DOMContentLoaded',()=>{
 applyTheme(savedTheme()??(scheme.matches?'dark':'light'));
 document.getElementById('theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(themeKey,theme)}catch{}applyTheme(theme)});
});
scheme.addEventListener('change',()=>{if(!savedTheme())applyTheme(scheme.matches?'dark':'light')});
window.addEventListener('storage',event=>{if(event.key===themeKey)applyTheme(savedTheme()??(scheme.matches?'dark':'light'))});
