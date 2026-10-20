import {useEffect,useState,type FocusEvent} from 'react';

/** A saída do ponteiro tem prioridade sobre foco residual de cliques. */
export function useCompactControls(enabled:boolean){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  setVisible(false);
  const hide=()=>setVisible(false);
  window.addEventListener('blur',hide);
  document.addEventListener('visibilitychange',hide);
  return()=>{
   window.removeEventListener('blur',hide);
   document.removeEventListener('visibilitychange',hide);
  };
 },[enabled]);
 return {
  visible:enabled&&visible,
  onPointerEnter:()=>{if(enabled)setVisible(true)},
  onPointerLeave:()=>setVisible(false),
  onPointerCancel:()=>setVisible(false),
  onFocusCapture:(event:FocusEvent<HTMLElement>)=>{
   if(enabled&&event.target.matches('button:focus-visible'))setVisible(true);
  },
 };
}
