use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};
use tauri_plugin_positioner::{WindowExt, Position};

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit ThymeStamp", true, None::<&str>)?;
    let quick_timestamp_i = MenuItem::with_id(app, "quick_timestamp", "Quick Timestamp", true, None::<&str>)?;
    let show_widget_i = MenuItem::with_id(app, "show_widget", "Show Widget", true, None::<&str>)?;
    let preferences_i = MenuItem::with_id(app, "preferences", "Preferences", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &quick_timestamp_i,
            &show_widget_i,
            &PredefinedMenuItem::separator(app)?,
            &preferences_i,
            &PredefinedMenuItem::separator(app)?,
            &quit_i,
        ],
    )?;

    let _tray = TrayIconBuilder::with_id("main_tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "quick_timestamp" => {
                if let Err(e) = quick_copy_timestamp(app) {
                    eprintln!("Failed to copy timestamp: {}", e);
                }
            }
            "show_widget" => {
                if let Err(e) = toggle_widget_window(app) {
                    eprintln!("Failed to toggle widget window: {}", e);
                }
            }
            "preferences" => {
                if let Err(e) = open_preferences(app) {
                    eprintln!("Failed to open preferences: {}", e);
                }
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Err(e) = toggle_widget_window(app) {
                    eprintln!("Failed to toggle widget window: {}", e);
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn quick_copy_timestamp<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let timestamp = chrono::Local::now().timestamp().to_string();
    
    // Copy to clipboard using the clipboard plugin
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard()
        .write_text(timestamp)
        .map_err(|e| tauri::Error::Anyhow(anyhow::anyhow!("Failed to copy to clipboard: {}", e)))?;
    
    Ok(())
}

pub fn toggle_widget_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
    if window.is_visible()? {
            window.hide()?;
        } else {
            show_widget_window(app)?;
        }
    } else {
        show_widget_window(app)?;
    }
    Ok(())
}

fn show_widget_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.show()?;
        window.set_focus()?;
        // apply always on top from prefs
        if let Some(state) = app.try_state::<std::sync::Arc<crate::prefs::RuntimePrefs>>() {
            let _ = window.set_always_on_top(state.always_on_top.load(std::sync::atomic::Ordering::Relaxed));
        }

        // Position under the tray icon without flicker
        // On macOS this anchors to the status bar icon; on others, top-right fallback
        #[cfg(target_os = "macos")]
        {
            let _ = window.move_window(Position::TopRight);
        }
        #[cfg(not(target_os = "macos"))]
        {
            if let Ok(Some(monitor)) = window.current_monitor() {
                let screen_size = monitor.size();
                let window_size = window.outer_size()?;
                let x = screen_size.width as i32 - window_size.width as i32 - 10;
                let y = 30;
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))?;
            }
        }
    }
    Ok(())
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(_window) = app.get_webview_window("main") {
        // For now, just show the widget window. Later we can create a separate preferences window
        show_widget_window(app)?;
    }
    Ok(())
}

fn open_preferences<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        // Navigate to preferences route and show
    let _ = window.eval("window.location.href = '/preferences';");
        window.show()?;
        window.set_focus()?;
    }
    Ok(())
}
