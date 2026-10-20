import {useCallback,useEffect,useRef,useState} from 'react';
import {listen} from '@tauri-apps/api/event';
import {invoke} from '@tauri-apps/api/core';
import {getCurrentWindow,LogicalSize} from '@tauri-apps/api/window';
import {openUrl} from '@tauri-apps/plugin-opener';
import {ArrowLeft,ChevronUp,GripHorizontal,Heart,Minus,Pin,PinOff,Search,Settings,SquareArrowOutUpRight,X} from 'lucide-react';
import {FloatingBubble} from './components/FloatingBubble';
import {FloatingPlayer,type PlayerHandle} from './components/FloatingPlayer';
import {PlayerControls} from './components/PlayerControls';
import {SearchResults} from './components/SearchResults';
import {SettingsPanel} from './components/SettingsPanel';
import {useCompactControls} from './hooks/useCompactControls';
import {defaults,readLocal,saveLocal,type Preferences} from './stores/preferences';
import {search as searchYouTube,formatPublishedDate,type Video} from './services/youtube';
import './App.css';

type Recent=Video&{time:number};
type Mode='bubble'|'search'|'compact'|'player'|'settings';
const recentKey='minitube.recent.v1',favoritesKey='minitube.favorites.v1',prefsKey='minitube.preferences.v1';
const desktop=()=>Boolean((window as Window&{__TAURI_INTERNALS__?:unknown}).__TAURI_INTERNALS__);
const sizeFor=(mode:Mode):[number,number]=>mode==='bubble'?[68,68]:mode==='settings'?[380,560]:mode==='search'?[350,64]:mode==='compact'?[300,202]:[530,480];

export default function App(){
 const [prefs,setPrefs]=useState<Preferences>(()=>readLocal(prefsKey,defaults));
 const [mode,setMode]=useState<Mode>('bubble');
 const compactControls=useCompactControls(mode==='compact');
 const [query,setQuery]=useState(''),[results,setResults]=useState<Video[]>([]),[selected,setSelected]=useState(0);
 const [active,setActive]=useState<Recent|null>(()=>readLocal<Recent|null>('minitube.active.v1',null));
 const [playerMounted,setPlayerMounted]=useState(false);
 const [history,setHistory]=useState<Recent[]>(()=>readLocal(recentKey,[])),[favorites,setFavorites]=useState<Video[]>(()=>readLocal(favoritesKey,[]));
 const [apiState,setApiState]=useState<'idle'|'loading'|'playing'|'paused'>('idle'),[playerReady,setPlayerReady]=useState(false),[time,setTime]=useState(0),[duration,setDuration]=useState(0);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[panelTitle,setPanelTitle]=useState('MiniTube');
 const [bubbleProgress,setBubbleProgress]=useState(0);
 const input=useRef<HTMLInputElement>(null),player=useRef<PlayerHandle>({player:null}),queryAbort=useRef<AbortController|null>(null),dragTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const searchScroll=useRef(0);
 const sync=(next:Preferences)=>{setPrefs(next);saveLocal(prefsKey,next)};

 const setWindowMode=useCallback(async(next:Mode,focus=false)=>{
  setMode(next);
  if(!desktop())return;
  try{
   const [w,h]=next==='search'&&results.length?[350,420]:sizeFor(next),win=getCurrentWindow();
   await win.setMinSize(new LogicalSize(next==='bubble'?50:next==='search'?320:next==='compact'?202:360,next==='bubble'?50:next==='search'?58:next==='compact'?202:340));
   await win.setSize(new LogicalSize(w,h));
   await win.setAlwaysOnTop(next==='bubble'||prefs.top);
   await win.setSkipTaskbar(next==='bubble');
   await win.setResizable(next==='player'||next==='search'||next==='compact');
   await invoke('clamp_window');
   if(focus)await win.setFocus();
  }catch(e){setError(String(e))}
 },[prefs.top,results.length]);

 const recordTime=useCallback((t:number,d:number)=>{
  setTime(t);setDuration(d);
  if(active){
   const item={...active,time:t,duration:d};
   setActive(item);saveLocal('minitube.active.v1',item);
   setHistory(current=>{const next=[item,...current.filter(x=>x.id!==item.id)].slice(0,40);saveLocal(recentKey,next);return next});
  }
  if(d>0)setBubbleProgress(Math.max(0,Math.min(1,t/d)));
 },[active]);

 // Recolher só muda o tamanho da janela: o mesmo iframe continua montado e tocando.
 const collapse=useCallback(()=>{
  const p=player.current.player;
  if(p)try{recordTime(p.getCurrentTime(),p.getDuration())}catch{}
  void setWindowMode('bubble');
 },[recordTime,setWindowMode]);

 const openPanel=useCallback((next:Mode,focus=true)=>{
  setError('');if((next==='player'||next==='compact')&&active)setPlayerMounted(true);void setWindowMode(next,focus);
  if(next==='search'){
   setTimeout(()=>input.current?.focus(),90);
  }
 },[active,setWindowMode]);

 const playVideo=useCallback((video:Video,at=0)=>{
  const previous=player.current.player;
  if(previous)try{recordTime(previous.getCurrentTime(),previous.getDuration())}catch{}
  queryAbort.current?.abort();setBusy(false);setError('');
  const index=results.findIndex(item=>item.id===video.id);if(index>=0)setSelected(index);
  const entry:Recent={...video,time:at};
  setActive(entry);setPlayerMounted(true);setTime(at);setDuration(entry.duration??0);setApiState('idle');setPlayerReady(false);
  saveLocal('minitube.active.v1',entry);
  setHistory(current=>{const next=[entry,...current.filter(x=>x.id!==video.id)].slice(0,40);saveLocal(recentKey,next);return next});
  setPanelTitle(video.title);void setWindowMode('compact',true);
 },[recordTime,results,setWindowMode]);

 const doSearch=useCallback(async(value=query)=>{
  const q=value.trim();if(!q)return;
  queryAbort.current?.abort();const controller=new AbortController();queryAbort.current=controller;
  setBusy(true);setError('');setResults([]);setSelected(0);
  searchScroll.current=0;
  try{
   const key=await invoke<string>('read_api_key');
   const videos=await searchYouTube(q,key,controller.signal);
   if(!videos.length)throw Error('Nenhum vídeo incorporável foi encontrado.');
   const withProgress=videos.map(v=>{const old=history.find(item=>item.id===v.id);return old?{...v,time:old.time,duration:v.duration??old.duration}:v});
   setResults(withProgress);
   if(withProgress.length===1&&withProgress[0].channel==='URL colada')playVideo(withProgress[0],withProgress[0].time??0);
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:String(e))}
  finally{if(!controller.signal.aborted)setBusy(false)}
 },[query,history,playVideo]);

 useEffect(()=>{if(desktop())void getCurrentWindow().setAlwaysOnTop(mode==='bubble'||prefs.top)},[prefs.top,mode]);
 useEffect(()=>{
  if(!desktop()||mode!=='search')return;
  const height=busy||results.length>0?420:error?104:64,win=getCurrentWindow();
  void (async()=>{try{await win.setMinSize(new LogicalSize(320,58));await win.setSize(new LogicalSize(350,height));await invoke('clamp_window')}catch(e){setError(String(e))}})();
 },[mode,busy,results.length,error]);
 useEffect(()=>{if(prefs.startHidden&&desktop()){const timer=setTimeout(()=>{void invoke('native_action',{action:'hide'})},350);return()=>clearTimeout(timer)}},[]);
 useEffect(()=>{
  const unlisten=listen<string>('action',event=>{
   const a=event.payload;
   if(a==='search')openPanel('search');
   else if(a==='settings')openPanel('settings');
   else if(a==='bubble'||a==='show'||a==='collapse')collapse();
  });
  return()=>{void unlisten.then(fn=>fn())};
 },[openPanel,collapse]);
 useEffect(()=>{const unlisten=listen<string>('native-error',e=>setError(e.payload));return()=>{void unlisten.then(fn=>fn())}},[]);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==='Escape'&&mode!=='bubble'){e.preventDefault();collapse()}
   else if((e.ctrlKey||e.metaKey)&&e.altKey&&e.key.toLowerCase()==='y'){e.preventDefault();openPanel('search')}
  };
  window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
 },[mode,collapse,openPanel]);
 useEffect(()=>()=>{queryAbort.current?.abort();try{player.current.player?.pauseVideo()}catch{}},[]);

 const toggleFavorite=()=>{
  if(!active)return;
  const found=favorites.some(v=>v.id===active.id);
  const next=found?favorites.filter(v=>v.id!==active.id):[{id:active.id,title:active.title,channel:active.channel,thumbnail:active.thumbnail,duration:active.duration},...favorites];
  setFavorites(next);saveLocal(favoritesKey,next);
 };
 const isFavorite=Boolean(active&&favorites.some(v=>v.id===active.id));
 const clearHistory=()=>{try{player.current.player?.pauseVideo()}catch{}setHistory([]);setActive(null);setPlayerMounted(false);setTime(0);setDuration(0);saveLocal(recentKey,[]);saveLocal('minitube.active.v1',null)};
 const playerError=(message:string)=>{setError(message);setApiState('paused')};
 const startDragOnHold=(event:React.PointerEvent<HTMLElement>)=>{
  if(!desktop()||event.button!==0)return;
  const target=event.target as HTMLElement;
  if(target.closest('button,input,textarea,select,a,iframe,[role="button"],.persistent-video,.compact-toolbar'))return;
  if(dragTimer.current)clearTimeout(dragTimer.current);
  dragTimer.current=setTimeout(()=>{void getCurrentWindow().startDragging()},180);
 };
 const stopDragOnRelease=()=>{if(dragTimer.current){clearTimeout(dragTimer.current);dragTimer.current=null}};

 return <main className={`window-shell mode-${mode} theme-${prefs.theme}`} data-controls-visible={compactControls.visible} style={{'--frame-opacity':prefs.opacity} as React.CSSProperties} onPointerEnter={compactControls.onPointerEnter} onPointerLeave={compactControls.onPointerLeave} onFocusCapture={compactControls.onFocusCapture} onPointerDownCapture={startDragOnHold} onPointerUpCapture={stopDragOnRelease} onPointerCancelCapture={()=>{stopDragOnRelease();compactControls.onPointerCancel()}}>
  <div className="bubble-stage" aria-hidden={mode!=='bubble'}>
   <FloatingBubble size={prefs.bubble} progress={bubbleProgress} onClick={()=>openPanel(active?'compact':'search')}/>
  </div>
  <div className="window-content" aria-hidden={mode==='bubble'||mode==='compact'}>
   <header className="titlebar">
    <span className="brand-mark" data-tauri-drag-region><span className="brand-play">▶</span></span><span className="brand-title" data-tauri-drag-region>MiniTube</span>
    {mode==='player'&&<span className="window-video-title" title={panelTitle}>{panelTitle}</span>}
    <div className="title-actions">
     {mode!=='search'&&<button title="Pesquisar" onClick={()=>openPanel('search')}><Search/></button>}
     {mode!=='settings'&&<button title="Configurações" onClick={()=>openPanel('settings')}><Settings/></button>}
     {mode==='player'&&<button title={prefs.top?'Desafixar':'Fixar no topo'} className={prefs.top?'is-active':''} onClick={()=>{const top=!prefs.top;sync({...prefs,top})}}>{prefs.top?<Pin/>:<PinOff/>}</button>}
     {(mode==='player'||mode==='settings')&&<button title="Minimizar para a bolinha; o áudio continua" onClick={collapse}><Minus/></button>}
    </div>
   </header>
   {mode==='search'&&<section className="search-panel">
    <form className="search-form" onSubmit={e=>{e.preventDefault();void doSearch()}}>
     <Search size={17}/>
     <input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setResults([]);setSelected(0);setError('');searchScroll.current=0}} placeholder="Nome do vídeo ou URL do YouTube" aria-label="Pesquisar no YouTube" onKeyDown={e=>{
      if(e.key==='ArrowDown'){e.preventDefault();setSelected(i=>Math.min(results.length-1,i+1))}
      else if(e.key==='ArrowUp'){e.preventDefault();setSelected(i=>Math.max(0,i-1))}
      else if(e.key==='Escape'){e.preventDefault();collapse()}
      else if(e.key==='Enter'&&results[selected]){e.preventDefault();playVideo(results[selected],results[selected].time??0)}
     }}/>
     <button type="submit" disabled={busy} aria-label="Buscar">{busy?<span className="spinner"/>:<Search size={16}/>}</button>
     <button type="button" className="search-close" aria-label="Recolher MiniTube" onClick={collapse}><X size={16}/></button>
    </form>
    {error&&<p className="inline-error" role="alert">{error}</p>}
    {busy&&<p className="empty-state">Buscando no YouTube…</p>}
    {!busy&&results.length>0&&<SearchResults items={results} selected={selected} scrollTop={searchScroll.current} onScroll={value=>{searchScroll.current=value}} onSelect={v=>playVideo(v,v.time??0)}/>}
   </section>}
   {mode==='player'&&<section className="player-panel">
    <div className="player-heading"><button onClick={()=>openPanel('search')} aria-label="Voltar aos resultados"><ArrowLeft size={16}/></button><div><strong>{active?.title||'YouTube'}</strong><small>{active?.channel}{formatPublishedDate(active?.publishedAt)&&` · Publicado em ${formatPublishedDate(active?.publishedAt)}`}</small></div><button className={isFavorite?'favorite active':'favorite'} aria-label={isFavorite?'Remover favorito':'Adicionar favorito'} onClick={toggleFavorite}><Heart fill={isFavorite?'currentColor':'none'} size={17}/></button></div>
    <div className="player-spacer"/>
    <PlayerControls handle={player.current} ready={playerReady} state={apiState==='playing'?1:2} time={time} duration={duration} favorite={isFavorite} onFavorite={toggleFavorite} onOpen={()=>active&&void openUrl(`https://www.youtube.com/watch?v=${active.id}`)}/>
    {error&&<div className="player-error" role="alert"><span>{error}</span>{active&&<button onClick={()=>void openUrl(`https://www.youtube.com/watch?v=${active.id}`)}><SquareArrowOutUpRight size={14}/>Abrir no YouTube</button>}</div>}
   </section>}
   {mode==='settings'&&<SettingsPanel prefs={prefs} onChange={sync} onError={setError} onClear={clearHistory} error={error}/>}
   {mode==='player'&&<footer className="statusbar"><span className={`status-dot ${apiState}`}/>{apiState==='playing'?'Reproduzindo':apiState==='loading'?'Carregando':apiState==='paused'?'Pausado':'Pronto para reproduzir'}<span className="footer-spacer"/><button onClick={()=>openPanel('search')}><Search size={13}/> Pesquisar</button></footer>}
   {(mode==='player'||mode==='search')&&<button aria-label="Redimensionar" className="resize-grip" onPointerDown={e=>{e.preventDefault();if(desktop())void getCurrentWindow().startResizeDragging('SouthEast')}}/>}
  </div>
  <div className={`persistent-video ${mode==='player'||mode==='compact'?'persistent-video-visible':'persistent-video-hidden'}`} aria-hidden={mode!=='player'&&mode!=='compact'}>
   {active&&playerMounted&&<FloatingPlayer key={active.id} id={active.id} start={active.time} handle={player.current} onTime={recordTime} onState={s=>setApiState(s===1?'playing':s===2?'paused':s===3?'loading':'idle')} onError={playerError} onReady={()=>{setPlayerReady(true);setApiState('idle')}}/>}
  </div>
  {mode==='compact'&&<div className="compact-toolbar" aria-label="Controles do MiniTube">
   <button title="Voltar aos resultados" aria-label="Voltar aos resultados" onClick={()=>openPanel('search')}><ArrowLeft size={16}/></button>
   <button title="Arrastar mini-player" aria-label="Arrastar mini-player" onPointerDown={e=>{if(e.button===0&&desktop()){e.preventDefault();void getCurrentWindow().startDragging()}}}><GripHorizontal size={16}/></button>
   <button title="Pesquisar outro vídeo" aria-label="Pesquisar outro vídeo" onClick={()=>openPanel('search')}><Search size={15}/></button>
   <button title="Abrir controles do vídeo" aria-label="Abrir controles do vídeo" onClick={()=>openPanel('player')}><ChevronUp size={16}/></button>
   <button title="Minimizar para a bolinha" aria-label="Minimizar para a bolinha" onClick={collapse}><Minus size={15}/></button>
  </div>}
  {mode==='compact'&&<button aria-label="Redimensionar mini-player" className="resize-grip compact-resize" onPointerDown={e=>{e.preventDefault();if(desktop())void getCurrentWindow().startResizeDragging('SouthEast')}}/>}
 </main>;
}
