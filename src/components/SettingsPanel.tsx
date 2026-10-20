import {useEffect,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {enable,disable,isEnabled} from '@tauri-apps/plugin-autostart';
import type {Preferences} from '../stores/preferences';
export function SettingsPanel({prefs,onChange,onError,onClear,error}:{prefs:Preferences;onChange:(p:Preferences)=>void;onError:(s:string)=>void;onClear:()=>void;error:string}){
 const [key,setKey]=useState(''),[auto,setAuto]=useState(false),[saved,setSaved]=useState('');
 useEffect(()=>{isEnabled().then(setAuto).catch(e=>onError(String(e)))},[]);
 const update=(value:Partial<Preferences>)=>onChange({...prefs,...value});
 return <section className="settings"><h2>Seu MiniTube</h2><p className="muted">Pequeno na tela. Sempre por perto.</p>
 <label>Tema<select value={prefs.theme} onChange={e=>update({theme:e.target.value as Preferences['theme']})}><option value="dark">Escuro</option><option value="light">Claro</option><option value="auto">Sistema</option></select></label>
 <label>Bolinha<select value={prefs.bubble} onChange={e=>update({bubble:Number(e.target.value) as 36|48|64})}>{[36,48,64].map(x=><option key={x} value={x}>{x} × {x} px</option>)}</select></label>
 <label><span>Sempre no topo</span><input type="checkbox" checked={prefs.top} onChange={e=>update({top:e.target.checked})}/></label>
 <label><span>Iniciar na bandeja</span><input type="checkbox" checked={prefs.startHidden} onChange={e=>update({startHidden:e.target.checked})}/></label>
 <label><span>Iniciar com Windows</span><input type="checkbox" checked={auto} onChange={async e=>{try{if(e.target.checked)await enable();else await disable();setAuto(await isEnabled())}catch(e){onError(String(e))}}}/></label>
 <label>Opacidade da moldura<input type="range" min=".6" max="1" step=".02" value={prefs.opacity} onChange={e=>update({opacity:Number(e.target.value)})}/></label>
 <hr/><label>Chave YouTube Data API v3<input type="password" autoComplete="off" placeholder="Sua chave pessoal" value={key} onChange={e=>setKey(e.target.value)}/></label>
 <p className="muted">Protegida pelo Gerenciador de Credenciais do Windows. Sem chave, cole uma URL.</p>
 <button onClick={async()=>{try{await invoke('save_api_key',{key});setKey('');setSaved('Chave salva com proteção do Windows.')}catch(e){onError(String(e))}}}>Salvar chave</button><p role="status">{saved}</p>
 <button onClick={onClear}>Limpar histórico local</button>{error&&<p className="inline-error" role="alert">{error}</p>}<p className="muted">Ctrl + Alt + Y · pesquisa rápida<br/>Escape · recolher sem interromper o áudio</p>
 </section>
}
