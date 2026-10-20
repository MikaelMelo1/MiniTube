export type Preferences={theme:'dark'|'light'|'auto';bubble:36|48|64;top:boolean;opacity:number;startHidden:boolean;configured:boolean};
export const defaults:Preferences={theme:'dark',bubble:48,top:true,opacity:.96,startHidden:false,configured:false};
export function readLocal<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)??'null')??fallback}catch{return fallback}}
export function saveLocal(key:string,value:unknown){localStorage.setItem(key,JSON.stringify(value))}
