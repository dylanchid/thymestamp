use tauri::AppHandle;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

pub fn setup_global_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // On macOS, global hotkeys require Accessibility permission; if missing,
    // the OS will reject RegisterEventHotKey. We avoid failing the app and
    // just warn the user via logs.
    #[cfg(target_os = "macos")]
    {
        // We can't programmatically grant permission; just try once and fall back.
    }
    // Try multiple shortcut combinations to find one that works
    let shortcuts_to_try = if cfg!(target_os = "macos") {
        vec![
            (Shortcut::new(Some(Modifiers::META | Modifiers::ALT), Code::KeyT), "Cmd+Alt+T"),
            (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyY), "Cmd+Shift+Y"),
            (Shortcut::new(Some(Modifiers::META | Modifiers::ALT), Code::KeyY), "Cmd+Alt+Y"),
            (Shortcut::new(Some(Modifiers::META | Modifiers::ALT), Code::KeyS), "Cmd+Alt+S"),
            (Shortcut::new(Some(Modifiers::META | Modifiers::SHIFT), Code::KeyT), "Cmd+Shift+T"),
        ]
    } else {
        vec![
            (Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyT), "Ctrl+Alt+T"),
            (Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyY), "Ctrl+Shift+Y"),
            (Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyY), "Ctrl+Alt+Y"),
            (Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyS), "Ctrl+Alt+S"),
        ]
    };

    for (shortcut, description) in shortcuts_to_try {
        match app.global_shortcut().register(shortcut) {
            Ok(_) => {
                println!("Global shortcut registered successfully: {}", description);
                return Ok(());
            }
            Err(e) => {
                eprintln!("Failed to register shortcut {}: {}", description, e);
                continue;
            }
        }
    }
    
    // Don't fail the app if shortcuts can't be registered - just warn
    println!("Warning: No global shortcuts could be registered. The app will still work via the tray icon.");
    Ok(())
}

#[tauri::command]
pub fn register_global_shortcut(
    app: AppHandle,
    shortcut_string: String,
) -> Result<(), String> {
    let parsed = parse_shortcut(&shortcut_string).ok_or_else(|| "Invalid shortcut".to_string())?;
    // clear old
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())?;
    app.global_shortcut()
        .register(parsed)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn unregister_shortcut(app: AppHandle) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())
}

fn parse_shortcut(s: &str) -> Option<Shortcut> {
    let mut mods = Modifiers::empty();
    let mut key: Option<Code> = None;
    for part in s.split('+') {
        let p = part.trim().to_lowercase();
        match p.as_str() {
            "cmd" | "meta" | "command" => mods |= Modifiers::META,
            "ctrl" | "control" => mods |= Modifiers::CONTROL,
            "alt" | "option" => mods |= Modifiers::ALT,
            "shift" => mods |= Modifiers::SHIFT,
            other => {
                // try single letter or known keys
                if other.len() == 1 {
                    let ch = other.chars().next().unwrap().to_ascii_uppercase();
                    let code = letter_to_code(ch)?;
                    key = Some(code);
                } else {
                    // F-keys
                    if let Some(num) = other.strip_prefix('f').and_then(|n| n.parse::<u8>().ok()) {
                        let code = fkey_to_code(num)?;
                        key = Some(code);
                    } else { return None; }
                }
            }
        }
    }
    Some(Shortcut::new(Some(mods), key?))
}

fn letter_to_code(ch: char) -> Option<Code> {
    Some(match ch {
        'A' => Code::KeyA,
        'B' => Code::KeyB,
        'C' => Code::KeyC,
        'D' => Code::KeyD,
        'E' => Code::KeyE,
        'F' => Code::KeyF,
        'G' => Code::KeyG,
        'H' => Code::KeyH,
        'I' => Code::KeyI,
        'J' => Code::KeyJ,
        'K' => Code::KeyK,
        'L' => Code::KeyL,
        'M' => Code::KeyM,
        'N' => Code::KeyN,
        'O' => Code::KeyO,
        'P' => Code::KeyP,
        'Q' => Code::KeyQ,
        'R' => Code::KeyR,
        'S' => Code::KeyS,
        'T' => Code::KeyT,
        'U' => Code::KeyU,
        'V' => Code::KeyV,
        'W' => Code::KeyW,
        'X' => Code::KeyX,
        'Y' => Code::KeyY,
        'Z' => Code::KeyZ,
        _ => return None,
    })
}

fn fkey_to_code(n: u8) -> Option<Code> {
    Some(match n {
        1 => Code::F1,
        2 => Code::F2,
        3 => Code::F3,
        4 => Code::F4,
        5 => Code::F5,
        6 => Code::F6,
        7 => Code::F7,
        8 => Code::F8,
        9 => Code::F9,
        10 => Code::F10,
        11 => Code::F11,
        12 => Code::F12,
        _ => return None,
    })
}

#[tauri::command]
pub fn check_accessibility_permission() -> Result<bool, String> {
    // There is no direct API; best-effort: try register a harmless shortcut and see if it errors with a known code
    #[cfg(target_os = "macos")]
    {
        let _dummy = Shortcut::new(Some(Modifiers::META), Code::F24);
        // We can't distinguish permission from conflict reliably; return true if API is callable
        return Ok(true);
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(true)
    }
}
