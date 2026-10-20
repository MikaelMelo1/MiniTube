import {Play,Pause,SkipBack,SkipForward,ExternalLink,Star} from 'lucide-react';
import type {PlayerHandle} from './FloatingPlayer';
export function PlayerControls({handle,state,time,duration,onFavorite,favorite,onOpen,ready}:{handle:PlayerHandle;ready:boolean;state:number;time:number;duration:number;onFavorite:()=>void;favorite:boolean;onOpen:()=>void}){
 const p=ready?handle.player:null;const rates=p?.getAvailablePlaybackRates?.()??[1];
 const clock=(x:number)=>`${Math.floor(x/60)}:${Math.floor(x%60).toString().padStart(2,'0')}`;
 return <div className="controls"><input aria-label="Posição" type="range" min="0" max={duration||1} value={time} onChange={e=>p?.seekTo(Number(e.target.value),true)}/><div className="control-row">
 <button title="Voltar 10 segundos" disabled={!p} onClick={()=>p?.seekTo(Math.max(0,time-10),true)}><SkipBack/></button>
 <button title="Reproduzir ou pausar" disabled={!p} onClick={()=>state===1?p?.pauseVideo():p?.playVideo()}>{state===1?<Pause/>:<Play/>}</button>
 <button title="Avançar 10 segundos" disabled={!p} onClick={()=>p?.seekTo(Math.min(duration,time+10),true)}><SkipForward/></button>
 <span className="time">{clock(time)} / {clock(duration)}</span>
 <select aria-label="Velocidade" disabled={!p} defaultValue="1" onChange={e=>p?.setPlaybackRate(Number(e.target.value))}>{rates.map(r=><option key={r} value={r}>{r}×</option>)}</select>
 <input aria-label="Volume" className="volume" type="range" min="0" max="100" defaultValue="70" onChange={e=>p?.setVolume(Number(e.target.value))}/>
 <button title="Favorito" className={favorite?'active':''} onClick={onFavorite}><Star/></button><button title="Abrir no YouTube" onClick={onOpen}><ExternalLink/></button>
 </div></div>
}
