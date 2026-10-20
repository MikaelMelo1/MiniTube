// @vitest-environment jsdom
import {act,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {FloatingPlayer,type PlayerHandle} from './FloatingPlayer';

describe('troca de vídeo',()=>{
 let container:HTMLDivElement;
 let root:ReturnType<typeof createRoot>;
 const instances:any[]=[];
 beforeEach(()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  instances.length=0;
  (window as any).YT={Player:class{
   options:any;
   pauseVideo=vi.fn(()=>this.options.events.onStateChange({data:2}));
   destroy=vi.fn();
   getCurrentTime=()=>42;
   getDuration=()=>120;
   constructor(_host:unknown,options:any){this.options=options;instances.push(this)}
  }};
  container=document.createElement('div');document.body.append(container);root=createRoot(container);
 });
 afterEach(async()=>{await act(async()=>root.unmount());container.remove();vi.useRealTimers()});
 it('mantém o vídeo selecionado quando o anterior é destruído',async()=>{
  const handle:PlayerHandle={player:null};
  function Harness(){
   const [id,setId]=useState('M7lc1UVf-VE');
   return <><button onClick={()=>setId('aqz-KE-bpKQ')}>Trocar</button><output>{id}</output><FloatingPlayer key={id} id={id} start={0} handle={handle} onTime={()=>setId(id)} onState={()=>{}} onReady={()=>{}} onError={()=>{}}/></>;
  }
  await act(async()=>root.render(<Harness/>));
  await act(async()=>instances[0].options.events.onReady());
  await act(async()=>container.querySelector('button')!.click());
  expect(container.querySelector('output')!.textContent).toBe('aqz-KE-bpKQ');
  expect(instances).toHaveLength(2);
  expect(instances[1].options.videoId).toBe('aqz-KE-bpKQ');
  expect(instances[0].destroy).toHaveBeenCalledOnce();
 });
 it('ignora eventos atrasados do player anterior',async()=>{
  const handle:PlayerHandle={player:null},onState=vi.fn(),onTime=vi.fn(),onError=vi.fn();
  const render=(id:string)=><FloatingPlayer key={id} id={id} start={0} handle={handle} onTime={onTime} onState={onState} onError={onError} onReady={()=>{}}/>;
  await act(async()=>root.render(render('M7lc1UVf-VE')));
  const old=instances[0];
  await act(async()=>root.render(render('aqz-KE-bpKQ')));
  await act(async()=>instances[1].options.events.onReady());
  await act(async()=>{old.options.events.onStateChange({data:1});old.options.events.onError({data:100});old.options.events.onReady()});
  expect(handle.player).toBe(instances[1]);
  expect(onState).not.toHaveBeenCalled();expect(onTime).not.toHaveBeenCalled();expect(onError).not.toHaveBeenCalled();
 });
});
