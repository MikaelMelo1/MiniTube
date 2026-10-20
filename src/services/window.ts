import {invoke} from '@tauri-apps/api/core';
import {getCurrentWindow,LogicalSize} from '@tauri-apps/api/window';
export const appWindow=getCurrentWindow();
export async function resize(width:number,height:number){await appWindow.setMinSize(new LogicalSize(width<100?width:360,height<100?height:300));await appWindow.setSize(new LogicalSize(width,height));await invoke('clamp_window');}
export const nativeAction=(action:string)=>invoke('native_action',{action});
