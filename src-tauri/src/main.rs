// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hex;
use md5;
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512, Digest};
use sha3::Keccak256;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::time::Instant;
use rayon::prelude::*;

mod uuid_generator;
use uuid_generator::{parse_uuid, generate_uuids};

mod jwt_tool;
use jwt_tool::{decode_jwt, encode_jwt, verify_jwt, generate_rsa_keypair, generate_jwt_secret};

mod url_tools;
use url_tools::{process_url_encode_decode, parse_url, build_url};

mod regex_tester;
use regex_tester::{test_regex, replace_regex};

#[derive(Serialize, Deserialize)]
struct HashResult {
    algorithm: String,
    hash: String,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn hash_string(input: &str, lowercase: bool) -> HashMap<String, String> {
    let start_time = Instant::now();
    let bytes = input.as_bytes();
    
    // Pre-allocate HashMap with known capacity for better performance
    let mut results = HashMap::with_capacity(7);
    
    // Helper closure for consistent hex formatting
    let format_hex = |data: &[u8]| -> String {
        if lowercase {
            hex::encode(data)
        } else {
            hex::encode(data).to_uppercase()
        }
    };
    
    // Compute all hashes in parallel using rayon
    let algorithms = vec!["md5", "sha1", "sha224", "sha256", "sha384", "sha512", "keccak256"];
    let hash_results: Vec<(&str, String)> = algorithms
        .into_par_iter()
        .map(|name| {
            let hash = match name {
                "md5" => {
                    let digest = md5::compute(bytes);
                    if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) }
                }
                "sha1" => {
                    let mut hasher = Sha1::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                "sha224" => {
                    let mut hasher = Sha224::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                "sha256" => {
                    let mut hasher = Sha256::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                "sha384" => {
                    let mut hasher = Sha384::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                "sha512" => {
                    let mut hasher = Sha512::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                "keccak256" => {
                    let mut hasher = Keccak256::new();
                    hasher.update(bytes);
                    format_hex(&hasher.finalize())
                }
                _ => unreachable!()
            };
            (name, hash)
        })
        .collect();
    
    // Insert results into HashMap
    for (name, hash) in hash_results {
        results.insert(name.to_string(), hash);
    }
    
    let duration = start_time.elapsed();
    println!("Hash string computation took: {:.2?} for {} bytes", duration, bytes.len());
    
    results
}

#[tauri::command]
fn hash_file(path: &str, lowercase: bool) -> Result<HashMap<String, String>, String> {
    let start_time = Instant::now();
    
    // Read file content once
    let read_start = Instant::now();
    let mut file = File::open(path).map_err(|e| {
        format!("Failed to open file: {}", e)
    })?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| {
        format!("Failed to read file: {}", e)
    })?;
    let read_duration = read_start.elapsed();
    println!("File read took: {:.2?} for {} bytes", read_duration, buffer.len());
    
    // Pre-allocate HashMap with known capacity for better performance
    let mut results = HashMap::with_capacity(7);
    
    // Helper closure for consistent hex formatting
    let format_hex = |data: &[u8]| -> String {
        if lowercase {
            hex::encode(data)
        } else {
            hex::encode(data).to_uppercase()
        }
    };
    
    // Compute all hashes in parallel using rayon
    let algorithms = vec!["md5", "sha1", "sha224", "sha256", "sha384", "sha512", "keccak256"];
    let hash_results: Vec<(&str, String)> = algorithms
        .into_par_iter()
        .map(|name| {
            let hash = match name {
                "md5" => {
                    let digest = md5::compute(&buffer);
                    if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) }
                }
                "sha1" => {
                    let mut hasher = Sha1::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                "sha224" => {
                    let mut hasher = Sha224::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                "sha256" => {
                    let mut hasher = Sha256::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                "sha384" => {
                    let mut hasher = Sha384::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                "sha512" => {
                    let mut hasher = Sha512::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                "keccak256" => {
                    let mut hasher = Keccak256::new();
                    hasher.update(&buffer);
                    format_hex(&hasher.finalize())
                }
                _ => unreachable!()
            };
            (name, hash)
        })
        .collect();
    
    // Insert results into HashMap
    for (name, hash) in hash_results {
        results.insert(name.to_string(), hash);
    }
    
    let total_duration = start_time.elapsed();
    let hash_duration = total_duration - read_duration;
    println!("Hash file computation took: {:.2?} (hash: {:.2?}) for {} bytes", 
             total_duration, hash_duration, buffer.len());
    
    Ok(results)
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder, PredefinedMenuItem};
            use tauri::Emitter;

            // Create "Check for Updates" menu item
            let check_updates = MenuItemBuilder::with_id("check_updates", "Check for Updates...")
                .build(app)?;

            // Create App submenu (macOS style)
            let app_menu = SubmenuBuilder::new(app, "DevWorkbench")
                .item(&PredefinedMenuItem::about(app, Some("About DevWorkbench"), None)?)
                .separator()
                .item(&check_updates)
                .separator()
                .item(&PredefinedMenuItem::services(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::hide(app, Some("Hide DevWorkbench"))?)
                .item(&PredefinedMenuItem::hide_others(app, Some("Hide Others"))?)
                .item(&PredefinedMenuItem::show_all(app, Some("Show All"))?)
                .separator()
                .item(&PredefinedMenuItem::quit(app, Some("Quit DevWorkbench"))?)
                .build()?;

            // Create Edit menu
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&PredefinedMenuItem::undo(app, None)?)
                .item(&PredefinedMenuItem::redo(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::cut(app, None)?)
                .item(&PredefinedMenuItem::copy(app, None)?)
                .item(&PredefinedMenuItem::paste(app, None)?)
                .item(&PredefinedMenuItem::select_all(app, None)?)
                .build()?;

            // Create Window menu
            let window_menu = SubmenuBuilder::new(app, "Window")
                .item(&PredefinedMenuItem::minimize(app, None)?)
                .item(&PredefinedMenuItem::maximize(app, None)?)
                .separator()
                .item(&PredefinedMenuItem::close_window(app, None)?)
                .build()?;

            // Build the menu bar
            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&edit_menu)
                .item(&window_menu)
                .build()?;

            app.set_menu(menu)?;

            // Handle menu events
            let app_handle = app.handle().clone();
            app.on_menu_event(move |_app, event| {
                if event.id().as_ref() == "check_updates" {
                    // Emit event to frontend to trigger update check
                    let _ = app_handle.emit("menu-check-updates", ());
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            hash_string,
            hash_file,
            parse_uuid,
            generate_uuids,
            decode_jwt,
            encode_jwt,
            verify_jwt,
            generate_rsa_keypair,
            generate_jwt_secret,
            process_url_encode_decode,
            parse_url,
            build_url,
            test_regex,
            replace_regex
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
