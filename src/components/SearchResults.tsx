import {useLayoutEffect,useRef} from 'react';
import {formatDuration,formatPublishedDate,type Video} from '../services/youtube';

export function SearchResults({items,selected,scrollTop=0,onScroll,onSelect}:{items:Video[];selected:number;scrollTop?:number;onScroll?:(value:number)=>void;onSelect:(video:Video)=>void}){
 const list=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{if(list.current)list.current.scrollTop=scrollTop},[]);
 return <div ref={list} className="results" role="listbox" aria-label="Vídeos" onScroll={event=>onScroll?.(event.currentTarget.scrollTop)}>{items.map((v,i)=>{
  const published=formatPublishedDate(v.publishedAt);
  return <button role="option" aria-selected={selected===i} className={'result '+(selected===i?'selected':'')} key={v.id} onClick={()=>onSelect(v)}>
   {v.thumbnail&&<img src={v.thumbnail} alt="" referrerPolicy="no-referrer" loading="lazy"/>}
   <span className="result-copy"><strong>{v.title}</strong><small><span>{v.channel}</span><span className="result-duration">{formatDuration(v.duration)}</span></small>{published&&<time className="result-published" dateTime={v.publishedAt}>Publicado em {published}</time>}</span>
  </button>;
 })}</div>;
}
