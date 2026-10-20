use tauri::{Emitter, Manager, PhysicalPosition};

#[tauri::command]
pub fn clamp_window(window: tauri::WebviewWindow) -> Result<(), String> {
  let pos = window.outer_position().map_err(|e| e.to_string())?;
  let size = window.outer_size().map_err(|e| e.to_string())?;
  let monitor = window
    .monitor_from_point(pos.x as f64 + size.width as f64 / 2., pos.y as f64 + size.height as f64 / 2.)
    .map_err(|e| e.to_string())?
    .or(window.primary_monitor().map_err(|e| e.to_string())?);
  if let Some(m) = monitor {
    let area = m.work_area();
    let max_x = (area.position.x + area.size.width.saturating_sub(size.width) as i32).max(area.position.x);
    let max_y = (area.position.y + area.size.height.saturating_sub(size.height) as i32).max(area.position.y);
    let mut x = pos.x.clamp(area.position.x, max_x);
    let mut y = pos.y.clamp(area.position.y, max_y);
    let snap = (16. * m.scale_factor()) as i32;
    if (x - area.position.x).abs() < snap { x = area.position.x; }
    if (max_x - x).abs() < snap { x = max_x; }
    if (y - area.position.y).abs() < snap { y = area.position.y; }
    if (max_y - y).abs() < snap { y = max_y; }
    window.set_position(PhysicalPosition::new(x, y)).map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[tauri::command]
pub fn native_action(app: tauri::AppHandle, action: String) -> Result<(), String> {
  let window = app.get_webview_window("main").ok_or("Janela indisponível")?;
  match action.as_str() {
    "near-cursor" | "search" => {
      let cursor = app.cursor_position().map_err(|e| e.to_string())?;
      window.set_position(PhysicalPosition::new(cursor.x as i32 + 12, cursor.y as i32 + 12)).map_err(|e| e.to_string())?;
      clamp_window(window.clone())?;
      window.show().map_err(|e| e.to_string())?;
      window.set_focus().map_err(|e| e.to_string())?;
      let _ = app.emit("action", "search");
    }
    "settings" => { window.show().map_err(|e| e.to_string())?; window.set_focus().map_err(|e| e.to_string())?; let _ = app.emit("action", "settings"); }
    "show" | "bubble" => { window.show().map_err(|e| e.to_string())?; let _ = app.emit("action", "bubble"); }
    "hide" => { let _ = app.emit("action", "collapse"); window.hide().map_err(|e| e.to_string())?; }
    "quit" => app.exit(0),
    _ => return Err("Ação inválida".into()),
  }
  Ok(())
}
