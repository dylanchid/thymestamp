mod tray;
mod timestamp;
mod shortcuts;
mod prefs;
use tauri::Manager;
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let prefs_state = std::sync::Arc::new(prefs::RuntimePrefs::default());
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _shortcut, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
            let _ = crate::tray::toggle_widget_window(&app);
                    }
                })
                .build(),
        )
        .manage(prefs_state.clone())
        .invoke_handler(tauri::generate_handler![
            timestamp::generate_timestamp,
            timestamp::get_current_formats,
            timestamp::format_tokens,
            timestamp::copy_to_clipboard,
            shortcuts::register_global_shortcut,
            shortcuts::unregister_shortcut,
            prefs::set_close_on_blur,
            prefs::set_always_on_top,
            prefs::get_runtime_prefs,
        ])
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize preferences from store
            if let Ok(store) = app.store("prefs.json") {
                if let Some(v) = store.get("closeOnBlur") { if let Some(b) = v.as_bool() { prefs_state.close_on_blur.store(b, std::sync::atomic::Ordering::Relaxed); } }
                if let Some(v) = store.get("alwaysOnTop") { if let Some(b) = v.as_bool() { prefs_state.always_on_top.store(b, std::sync::atomic::Ordering::Relaxed); } }
            }

            // Create system tray
            tray::create_tray(app.handle())?;
            
            // Setup global shortcuts
            if let Err(e) = shortcuts::setup_global_shortcuts(app.handle()) {
                eprintln!("Failed to setup global shortcuts: {}", e);
            }

            // Close on blur: listen to focus change and close window according to prefs
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                let prefs_state_for_window = prefs_state.clone();
                window.on_window_event(move |event| {
                    use tauri::WindowEvent;
                    if let WindowEvent::Focused(false) = event {
                        if prefs_state_for_window.close_on_blur.load(std::sync::atomic::Ordering::Relaxed) {
                            if let Some(w) = app_handle.get_webview_window("main") {
                                let _ = w.hide();
                            }
                        }
                    }
                });
                // Always on top behavior
                let _ = window.set_always_on_top(prefs_state.always_on_top.load(std::sync::atomic::Ordering::Relaxed));
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
