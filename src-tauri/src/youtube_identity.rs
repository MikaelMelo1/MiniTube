#[cfg(windows)]
pub fn install(window: &tauri::WebviewWindow) -> tauri::Result<()> {
  window.with_webview(|platform| unsafe {
    use webview2_com::{
      Microsoft::Web::WebView2::Win32::COREWEBVIEW2_WEB_RESOURCE_CONTEXT_DOCUMENT,
      WebResourceRequestedEventHandler,
    };
    use windows::core::w;
    let result = (|| -> windows::core::Result<()> {
      let webview = platform.controller().CoreWebView2()?;
      webview.AddWebResourceRequestedFilter(
        w!("https://www.youtube.com/embed/*"),
        COREWEBVIEW2_WEB_RESOURCE_CONTEXT_DOCUMENT,
      )?;
      let handler = WebResourceRequestedEventHandler::create(Box::new(|_, args| {
        if let Some(args) = args {
          args.Request()?.Headers()?.SetHeader(
            w!("Referer"),
            w!("https://com.minitube.desktop/"),
          )?;
        }
        Ok(())
      }));
      let mut token = 0;
      webview.add_WebResourceRequested(&handler, &mut token)?;
      Ok(())
    })();
    if let Err(error) = result {
      eprintln!("Falha ao configurar identificação do YouTube: {error}");
    }
  })
}
