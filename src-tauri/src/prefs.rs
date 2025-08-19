use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Default)]
pub struct RuntimePrefs {
    pub close_on_blur: AtomicBool,
    pub always_on_top: AtomicBool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrefsSnapshot {
    pub close_on_blur: bool,
    pub always_on_top: bool,
}

impl RuntimePrefs {
    pub fn snapshot(&self) -> PrefsSnapshot {
        PrefsSnapshot {
            close_on_blur: self.close_on_blur.load(Ordering::Relaxed),
            always_on_top: self.always_on_top.load(Ordering::Relaxed),
        }
    }
}

#[tauri::command]
pub fn set_close_on_blur(state: State<'_, Arc<RuntimePrefs>>, value: bool) {
    state.close_on_blur.store(value, Ordering::Relaxed);
}

#[tauri::command]
pub fn set_always_on_top(state: State<'_, Arc<RuntimePrefs>>, value: bool) {
    state.always_on_top.store(value, Ordering::Relaxed);
}

#[tauri::command]
pub fn get_runtime_prefs(state: State<'_, Arc<RuntimePrefs>>) -> PrefsSnapshot {
    state.snapshot()
}
