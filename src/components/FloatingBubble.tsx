import {useRef} from 'react';
import {getCurrentWindow} from '@tauri-apps/api/window';

export function FloatingBubble({size,progress,onClick}:{size:number;progress:number;onClick:()=>void}){
 const holdTimer=useRef<number|undefined>(undefined);
 const dragged=useRef(false);
 const handlePointerDown=(event:React.PointerEvent<HTMLButtonElement>)=>{
  if(event.button!==0)return;
  dragged.current=false;
  holdTimer.current=window.setTimeout(()=>{dragged.current=true;void getCurrentWindow().startDragging()},220);
 };
 const clearHold=()=>{if(holdTimer.current!==undefined){window.clearTimeout(holdTimer.current);holdTimer.current=undefined}};
 const handleClick=(event:React.MouseEvent<HTMLButtonElement>)=>{
  if(dragged.current){event.preventDefault();dragged.current=false;return}
  onClick();
 };
 return <div className="bubble-drag-region" data-tauri-drag-region>
  <button className="bubble" title="MiniTube · clique para abrir, segure para arrastar" aria-label="Abrir MiniTube" style={{width:size,height:size,WebkitAppRegion:'no-drag'} as React.CSSProperties} onPointerDown={handlePointerDown} onPointerUp={clearHold} onPointerCancel={clearHold} onClick={handleClick}>
   <svg className="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${Math.max(0,progress)*138.23} 138.23`}/></svg>
   <svg className="youtube-mark" viewBox="0 0 48 36" aria-hidden="true"><rect x="3" y="4" width="42" height="28" rx="9" fill="#ff4055"/><path d="M21 12.5v11l9.5-5.5z" fill="white"/></svg>
  </button>
 </div>;
}
