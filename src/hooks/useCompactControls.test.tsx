// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {useCompactControls} from './useCompactControls';

describe('ocultação imediata dos controles compactos',()=>{
 let container:HTMLDivElement;
 let root:ReturnType<typeof createRoot>;
 function Harness({enabled=true}:{enabled?:boolean}){
  const controls=useCompactControls(enabled);
  return <main data-visible={controls.visible} onPointerEnter={controls.onPointerEnter} onPointerLeave={controls.onPointerLeave} onPointerCancel={controls.onPointerCancel}><button>Menu</button><iframe title="Vídeo"/></main>;
 }
 beforeEach(async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  container=document.createElement('div');document.body.append(container);root=createRoot(container);
  await act(async()=>root.render(<Harness/>));
 });
 afterEach(async()=>{await act(async()=>root.unmount());container.remove()});
 const isVisible=()=>container.querySelector('main')!.dataset.visible;
 async function enter(){await act(async()=>container.querySelector('main')!.dispatchEvent(new MouseEvent('pointerover',{bubbles:true,relatedTarget:document.body})))}
 it('oculta na saída mesmo com botão focado depois de clique',async()=>{
  await enter();expect(isVisible()).toBe('true');
  container.querySelector('button')!.focus();
  await act(async()=>container.querySelector('main')!.dispatchEvent(new MouseEvent('pointerout',{bubbles:true,relatedTarget:document.body})));
  expect(isVisible()).toBe('false');
  expect(document.activeElement).toBe(container.querySelector('button'));
 });
 it('oculta ao perder foco para outro programa',async()=>{
  await enter();
  await act(async()=>window.dispatchEvent(new Event('blur')));
  expect(isVisible()).toBe('false');
 });
 it('oculta ao cancelar o ponteiro e ao sair do modo compacto',async()=>{
  await enter();
  await act(async()=>container.querySelector('main')!.dispatchEvent(new Event('pointercancel',{bubbles:true})));
  expect(isVisible()).toBe('false');
  await enter();
  await act(async()=>root.render(<Harness enabled={false}/>));
  expect(isVisible()).toBe('false');
 });
});
