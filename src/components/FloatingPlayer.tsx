import {useEffect,useRef,useState} from 'react';
import {playbackError} from '../services/youtube';
let api:Promise<void>|undefined;
function loadAPI(){return api??=new Promise<void>((resolve,reject)=>{if(window.YT?.Player){resolve();return}window.onYouTubeIframeAPIReady=resolve;const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{api=undefined;reject(Error('Sem conexão com a API do YouTube.'))};document.head.append(s);setTimeout(()=>{if(!window.YT?.Player){api=undefined;reject(Error('A API do YouTube não respondeu.'))}},15000)})}
export interface PlayerHandle {player:YT.Player|null}
export function FloatingPlayer({id,start,handle,onTime,onState,onError,onReady}:{id:string;start:number;handle:PlayerHandle;onTime:(time:number,duration:number)=>void;onState:(state:number)=>void;onError:(message:string)=>void;onReady:()=>void}){
 const host=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false);
 const callbacks=useRef({onTime,onState,onError,onReady});
 callbacks.current={onTime,onState,onError,onReady};
 useEffect(()=>{
  let cancelled=false;
  let player:YT.Player|undefined;
  let timer:ReturnType<typeof setInterval>|undefined;
  setReady(false);
  loadAPI().then(()=>{
   if(cancelled||!host.current)return;
   const el=document.createElement('div');
   host.current.replaceChildren(el);
   player=new window.YT.Player(el,{
    width:'100%',height:'100%',videoId:id,
    playerVars:{playsinline:1,start:Math.floor(start),origin:location.origin,...{widget_referrer:'https://com.minitube.desktop/'}},
    events:{
     onReady:()=>{
      if(cancelled)return;
      handle.player=player!;setReady(true);callbacks.current.onReady();
     },
     onStateChange:(event:YT.OnStateChangeEvent)=>{
      if(cancelled)return;
      callbacks.current.onState(event.data);
      if(timer)clearInterval(timer);
      timer=undefined;
      if(event.data===1)timer=setInterval(()=>{
       if(!cancelled&&player)callbacks.current.onTime(player.getCurrentTime(),player.getDuration());
      },1000);
     },
     onError:(event:YT.OnErrorEvent)=>{if(!cancelled)callbacks.current.onError(playbackError(event.data))},
     onAutoplayBlocked:()=>{if(!cancelled)callbacks.current.onError('Reprodução automática bloqueada. Clique no botão do YouTube para continuar.')},
    },
   });
  }).catch(error=>{if(!cancelled)callbacks.current.onError(String(error))});
  // O pai salva o progresso antes de trocar o vídeo. Cleanup não deve restaurar o anterior.
  return()=>{
   cancelled=true;
   if(timer)clearInterval(timer);
   if(player){try{player.pauseVideo()}catch{}try{player.destroy()}catch{}}
   if(handle.player===player)handle.player=null;
  };
 },[id]);
 return <div className="video-frame" aria-label="Player YouTube"><div ref={host} className="youtube-host"/>{!ready&&<p className="player-loading">Conectando ao YouTube…</p>}</div>;
}
