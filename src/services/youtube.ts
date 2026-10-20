export function videoId(input:string):string|null {
 try {const u=new URL(input); if(u.protocol!=='https:' || u.port || u.username || u.password)return null;
 let id:string|null=null;
 if(u.hostname==='youtu.be')id=u.pathname.slice(1);
 if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))id=u.pathname==='/watch'?u.searchParams.get('v'): /^\/(shorts|embed|live)\/([^/]+)\/?$/.exec(u.pathname)?.[2]??null;
 return id&&/^[\w-]{11}$/.test(id)?id:null;
 }catch{return null}
}
export const playbackError=(code:number)=>({2:'Identificador de vídeo inválido.',5:'O WebView2 não conseguiu reproduzir este vídeo.',100:'Vídeo removido, privado ou indisponível.',101:'O autor não permite incorporação. Abra no YouTube.',150:'O autor não permite incorporação. Abra no YouTube.',153:'YouTube recusou a identificação do cliente (erro 153). Abra no navegador.'}[code]??`Falha no player (${code}).`);
export type Video={id:string;title:string;channel:string;thumbnail?:string;time?:number;duration?:number;publishedAt?:string};
export function formatPublishedDate(value:string|undefined):string|null{
 if(!value)return null;
 const date=new Date(value);
 return Number.isNaN(date.getTime())?null:new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}
export function secondsFromIsoDuration(value:string|undefined):number|undefined{
 if(!value)return undefined;
 const match=/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
 if(!match)return undefined;
 return Number(match[1]??0)*3600+Number(match[2]??0)*60+Number(match[3]??0);
}
export function formatDuration(seconds:number|undefined):string{
 if(seconds===undefined||!Number.isFinite(seconds)||seconds<0)return '—';
 const total=Math.floor(seconds),s=String(total%60).padStart(2,'0'),minutes=Math.floor(total/60)%60,hours=Math.floor(total/3600);
 return hours?`${hours}:${String(minutes).padStart(2,'0')}:${s}`:`${Math.floor(total/60)}:${s}`;
}
export async function search(query:string,key:string,signal:AbortSignal):Promise<Video[]>{
 const direct=videoId(query);if(direct)return [{id:direct,title:'Vídeo do YouTube',channel:'URL colada',thumbnail:`https://i.ytimg.com/vi/${direct}/mqdefault.jpg`}];
 if(!key)throw Error('A pesquisa por nome precisa de uma chave da YouTube Data API v3. Cole um link HTTPS do YouTube para abrir sem chave.');
 const p=new URLSearchParams({part:'snippet',type:'video',videoEmbeddable:'true',maxResults:'12',q:query,key});
 const r=await fetch('https://www.googleapis.com/youtube/v3/search?'+p,{signal});
 if(!r.ok)throw Error(r.status===403?'Chave inválida, restrição ou cota excedida.':'Falha na pesquisa. Verifique sua conexão.');
 const data=await r.json(),items=data.items as any[];
 if(!items.length)return [];
 const videos=items.map(x=>({id:x.id.videoId,title:x.snippet.title,channel:x.snippet.channelTitle,publishedAt:x.snippet.publishedAt,thumbnail:x.snippet.thumbnails.medium?.url??x.snippet.thumbnails.default?.url}));
 const detailsParams=new URLSearchParams({part:'contentDetails',id:videos.map(v=>v.id).join(','),key});
 try{
  const details=await fetch('https://www.googleapis.com/youtube/v3/videos?'+detailsParams,{signal});
  if(details.ok){
   const detailData=await details.json(),durations=new Map<string,number>();
   for(const item of detailData.items??[]){const seconds=secondsFromIsoDuration(item.contentDetails?.duration);if(seconds!==undefined)durations.set(item.id,seconds)}
   return videos.map(v=>({...v,duration:durations.get(v.id)}));
  }
 }catch(error){if(signal.aborted)throw error}
 return videos;
}
