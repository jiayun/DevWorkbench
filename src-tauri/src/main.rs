// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use hex;
use md2::Md2;
use md4::Md4;
use md5;
use sha1::Sha1;
use sha2::{Sha224, Sha256, Sha384, Sha512, Digest};
use sha3::Keccak256;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::sync::Arc;
use rayon::prelude::*;

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
    // Convert string to bytes once and share between threads
    let bytes = Arc::new(input.as_bytes().to_vec());
    
    // Define all hash algorithms to compute
    let algorithms = vec![
        ("md2", 0),
        ("md4", 1), 
        ("md5", 2),
        ("sha1", 3),
        ("sha224", 4),
        ("sha256", 5),
        ("sha384", 6),
        ("sha512", 7),
        ("keccak256", 8),
    ];
    
    // Use rayon for efficient parallel computation
    let results: HashMap<String, String> = algorithms
        .into_par_iter()
        .map(|(name, algo_type)| {
            let bytes = Arc::clone(&bytes);
            let hash = match algo_type {
                0 => { // MD2
                    let mut hasher = Md2::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                1 => { // MD4
                    let mut hasher = Md4::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                2 => { // MD5
                    let digest = md5::compute(&*bytes);
                    if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) }
                }
                3 => { // SHA1
                    let mut hasher = Sha1::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                4 => { // SHA224
                    let mut hasher = Sha224::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                5 => { // SHA256
                    let mut hasher = Sha256::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                6 => { // SHA384
                    let mut hasher = Sha384::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                7 => { // SHA512
                    let mut hasher = Sha512::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                8 => { // Keccak-256
                    let mut hasher = Keccak256::new();
                    hasher.update(&*bytes);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                _ => unreachable!()
            };
            (name.to_string(), hash)
        })
        .collect();
    
    results
}

#[tauri::command]
fn hash_file(path: &str, lowercase: bool) -> Result<HashMap<String, String>, String> {
    // Read file content once
    let mut file = File::open(path).map_err(|e| {
        format!("Failed to open file: {}", e)
    })?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| {
        format!("Failed to read file: {}", e)
    })?;
    
    // Use Arc to share the buffer between threads efficiently
    let buffer = Arc::new(buffer);
    
    // Define all hash algorithms to compute
    let algorithms = vec![
        ("md2", 0),
        ("md4", 1), 
        ("md5", 2),
        ("sha1", 3),
        ("sha224", 4),
        ("sha256", 5),
        ("sha384", 6),
        ("sha512", 7),
        ("keccak256", 8),
    ];
    
    // Use rayon for efficient parallel computation
    let results: HashMap<String, String> = algorithms
        .into_par_iter()
        .map(|(name, algo_type)| {
            let buffer = Arc::clone(&buffer);
            let hash = match algo_type {
                0 => { // MD2
                    let mut hasher = Md2::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                1 => { // MD4
                    let mut hasher = Md4::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                2 => { // MD5
                    let digest = md5::compute(&*buffer);
                    if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) }
                }
                3 => { // SHA1
                    let mut hasher = Sha1::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                4 => { // SHA224
                    let mut hasher = Sha224::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                5 => { // SHA256
                    let mut hasher = Sha256::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                6 => { // SHA384
                    let mut hasher = Sha384::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                7 => { // SHA512
                    let mut hasher = Sha512::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                8 => { // Keccak-256
                    let mut hasher = Keccak256::new();
                    hasher.update(&*buffer);
                    let result = hasher.finalize();
                    if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() }
                }
                _ => unreachable!()
            };
            (name.to_string(), hash)
        })
        .collect();
    
    Ok(results)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet, hash_string, hash_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
