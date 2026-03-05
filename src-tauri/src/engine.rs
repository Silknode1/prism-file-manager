use tauri::{AppHandle, Emitter};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use blake3::Hasher;
use jwalk::WalkDir;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ScanOptions {
    pub paths: Vec<String>,
    pub ignore_rules: Vec<String>,
    pub min_size: u64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ProgressEvent {
    pub scanned: u64,
    pub duplicates_found: u64,
    pub bytes_saved: u64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DuplicateGroup {
    pub hash: String,
    pub size: u64,
    pub modified_at: u64,
    pub files: Vec<String>,
}

const PREHASH_SIZE: u64 = 4096;

pub fn start_scan(app: AppHandle, options: ScanOptions) {
    std::thread::spawn(move || {
        run_scan(app, options);
    });
}

fn hash_file_partial(path: &Path, size: u64) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut hasher = Hasher::new();
    let mut buffer = [0u8; PREHASH_SIZE as usize];

    if size <= PREHASH_SIZE * 2 {
        // Just hash the whole thing if it's small
        let mut full_buf = Vec::new();
        file.read_to_end(&mut full_buf).ok()?;
        hasher.update(&full_buf);
    } else {
        // Head
        if let Ok(n) = file.read(&mut buffer) {
            hasher.update(&buffer[..n]);
        }
        // Tail
        if file.seek(SeekFrom::End(-(PREHASH_SIZE as i64))).is_ok() {
            if let Ok(n) = file.read(&mut buffer) {
                hasher.update(&buffer[..n]);
            }
        }
    }
    Some(hasher.finalize().to_hex().to_string())
}

fn hash_file_full(path: &Path) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut hasher = Hasher::new();
    let mut buffer = [0u8; 8192];
    while let Ok(n) = file.read(&mut buffer) {
        if n == 0 { break; }
        hasher.update(&buffer[..n]);
    }
    Some(hasher.finalize().to_hex().to_string())
}

fn run_scan(app: AppHandle, options: ScanOptions) {
    let mut num_scanned = 0;
    let mut size_map: HashMap<u64, Vec<PathBuf>> = HashMap::new();

    // 1. Discovery Phase
    for path in &options.paths {
        for entry in WalkDir::new(path).skip_hidden(false) {
            if let Ok(dir_entry) = entry {
                if !dir_entry.file_type().is_file() { continue; }
                
                let path_str = dir_entry.path().to_string_lossy().to_string();
                
                // IGNORE RULES LOGIC
                // Check if the current file path contains any of the ignore rules
                let should_ignore = options.ignore_rules.iter().any(|rule| {
                    !rule.is_empty() && path_str.to_lowercase().contains(&rule.to_lowercase())
                });
                
                if should_ignore { continue; }
                
                if let Ok(metadata) = dir_entry.metadata() {
                    let size = metadata.len();
                    if size < options.min_size { continue; }
                    size_map.entry(size).or_default().push(dir_entry.path());
                    num_scanned += 1;
                    if num_scanned % 1000 == 0 {
                        let _ = app.emit("scan-progress", ProgressEvent {
                            scanned: num_scanned,
                            duplicates_found: 0,
                            bytes_saved: 0,
                        });
                    }
                }
            }
        }
    }

    // Filter potential sizes
    let candidate_sizes: Vec<_> = size_map.into_iter().filter(|(_, files)| files.len() > 1).collect();
    
    // 2. Pre-hash Phase
    let mut prehash_map: HashMap<String, Vec<PathBuf>> = HashMap::new();
    for (size, files) in candidate_sizes {
        for file in files {
            if let Some(hash) = hash_file_partial(&file, size) {
                prehash_map.entry(hash).or_default().push(file);
            }
        }
    }
    
    let candidate_prehashes: Vec<_> = prehash_map.into_iter().filter(|(_, files)| files.len() > 1).collect();

    // 3. Full-hash Phase
    let mut fullhash_map: HashMap<String, Vec<PathBuf>> = HashMap::new();
    let mut dupes_found = 0;
    let mut bytes_saved = 0;
    
    for (_, files) in candidate_prehashes {
        for file in files {
            if let Some(hash) = hash_file_full(&file) {
                fullhash_map.entry(hash).or_default().push(file);
            }
        }
    }

    let mut final_results = Vec::new();
    for (hash, files) in fullhash_map {
        if files.len() > 1 {
            let meta = std::fs::metadata(&files[0]);
            let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
            
            // Extract the 'modified_at' timestamp for sorting capabilities
            let modified_at = meta.ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
                
            dupes_found += (files.len() as u64) - 1;
            bytes_saved += ((files.len() as u64) - 1) * size;
            
            final_results.push(DuplicateGroup {
                hash,
                size,
                modified_at,
                files: files.into_iter().map(|p| p.to_string_lossy().into_owned()).collect(),
            });
        }
    }

    let _ = app.emit("scan-progress", ProgressEvent {
        scanned: num_scanned,
        duplicates_found: dupes_found,
        bytes_saved,
    });
    
    let _ = app.emit("scan-complete", final_results);
}

pub fn trash_items(paths: Vec<String>) -> Result<(), String> {
    trash::delete_all(&paths).map_err(|e| e.to_string())
}
