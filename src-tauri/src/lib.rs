mod engine;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn start_scan_cmd(app: tauri::AppHandle, options: engine::ScanOptions) {
    engine::start_scan(app, options);
}

#[tauri::command]
fn trash_items_cmd(paths: Vec<String>) -> Result<(), String> {
    engine::trash_items(paths)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_scan_cmd, trash_items_cmd])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
