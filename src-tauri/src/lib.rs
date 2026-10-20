use tauri::{
  menu::{CheckMenuItem, Menu, MenuItem},
  tray::TrayIconBuilder,
  Emitter, Manager, PhysicalPosition,
};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

mod window_manager;
mod youtube_identity;

#[tauri::command]
fn save_api_key(key: String) -> Result<(), String> {
  let entry = keyring::Entry::new("com.minitube.desktop", "youtube-api").map_err(|e| e.to_string())?;
  if key.is_empty() {
    match entry.delete_credential() {
      Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
      Err(error) => Err(error.to_string()),
    }
  } else { entry.set_password(&key).map_err(|e| e.to_string()) }
}

#[tauri::command]
fn read_api_key() -> Result<String, String> {
  match keyring::Entry::new("com.minitube.desktop", "youtube-api").map_err(|e| e.to_string())?.get_password() {
    Ok(key) => Ok(key),
    Err(keyring::Error::NoEntry) => Ok(String::new()),
    Err(error) => Err(error.to_string()),
  }
}

fn show_at_cursor(app: &tauri::AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    if let Ok(cursor) = app.cursor_position() {
      let _ = window.set_min_size(Some(tauri::LogicalSize::new(320., 58.)));
      let _ = window.set_size(tauri::LogicalSize::new(350., 64.));
      let _ = window.set_position(PhysicalPosition::new(cursor.x as i32 + 10, cursor.y as i32 + 10));
      let _ = window.show();
      let _ = window.set_focus();
      let _ = app.emit("action", "search");
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let search_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyY);
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _, _| show_at_cursor(app)))
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_autostart::Builder::new().args(["--autostart"]).build())
    .plugin(tauri_plugin_global_shortcut::Builder::new().with_handler(move |app, shortcut, event| {
      if shortcut == &search_shortcut && event.state() == ShortcutState::Pressed { show_at_cursor(app); }
    }).build())
    .setup(move |app| {
      let window = app.get_webview_window("main").ok_or("Janela principal ausente")?;
      youtube_identity::install(&window)?;
      app.global_shortcut().register(search_shortcut)?;
      if let Some(monitor) = window.primary_monitor()? {
        let area = monitor.work_area();
        let x = area.position.x + area.size.width as i32 - 88;
        let y = area.position.y + area.size.height as i32 - 100;
        window.set_position(PhysicalPosition::new(x, y))?;
      }
      window_manager::clamp_window(window.clone()).map_err(std::io::Error::other)?;

      let search = MenuItem::with_id(app, "search", "Abrir pesquisa", true, None::<&str>)?;
      let show = MenuItem::with_id(app, "bubble", "Mostrar bolinha", true, None::<&str>)?;
      let hide = MenuItem::with_id(app, "hide", "Ocultar bolinha", true, None::<&str>)?;
      let settings = MenuItem::with_id(app, "settings", "Configurações", true, None::<&str>)?;
      let auto = CheckMenuItem::with_id(app, "autostart", "Iniciar com Windows", true, app.autolaunch().is_enabled().unwrap_or(false), None::<&str>)?;
      let quit = MenuItem::with_id(app, "quit", "Sair do MiniTube", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&search, &show, &hide, &settings, &auto, &quit])?;
      let auto_item = auto.clone();
      TrayIconBuilder::with_id("minitube")
        .icon(app.default_window_icon().ok_or("Ícone ausente")?.clone())
        .tooltip("MiniTube")
        .menu(&menu)
        .on_menu_event(move |app, event| match event.id.as_ref() {
          "quit" => app.exit(0),
          "autostart" => {
            let manager = app.autolaunch();
            let result = if manager.is_enabled().unwrap_or(false) { manager.disable() } else { manager.enable() };
            if let Err(error) = result { let _ = app.emit("native-error", error.to_string()); }
            let _ = auto_item.set_checked(manager.is_enabled().unwrap_or(false));
          }
          "search" => show_at_cursor(app),
          "bubble" => { let _ = app.emit("action", "bubble"); if let Some(w) = app.get_webview_window("main") { let _ = w.show(); } }
          "hide" => { let _ = app.emit("action", "collapse"); if let Some(w) = app.get_webview_window("main") { let _ = w.hide(); } }
          "settings" => { let _ = app.emit("action", "settings"); if let Some(w) = app.get_webview_window("main") { let _ = w.show(); let _ = w.set_focus(); } }
          _ => {}
        })
        .build(app)?;
      let app_handle = app.handle().clone();
      window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
          api.prevent_close();
          let _ = app_handle.emit("action", "collapse");
          if let Some(w) = app_handle.get_webview_window("main") { let _ = w.hide(); }
        }
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![window_manager::clamp_window, window_manager::native_action, save_api_key, read_api_key])
    .run(tauri::generate_context!())
    .expect("Não foi possível iniciar o MiniTube");
}
