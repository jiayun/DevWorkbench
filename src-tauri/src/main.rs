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
    let mut results = HashMap::new();
    
    // MD2
    let mut hasher = Md2::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("md2".to_string(), hash);
    
    // MD4
    let mut hasher = Md4::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("md4".to_string(), hash);
    
    // MD5
    let digest = md5::compute(input.as_bytes());
    let hash = if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) };
    results.insert("md5".to_string(), hash);
    
    // SHA1
    let mut hasher = Sha1::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha1".to_string(), hash);
    
    // SHA224
    let mut hasher = Sha224::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha224".to_string(), hash);
    
    // SHA256
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha256".to_string(), hash);
    
    // SHA384
    let mut hasher = Sha384::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha384".to_string(), hash);
    
    // SHA512
    let mut hasher = Sha512::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha512".to_string(), hash);
    
    // Keccak-256
    let mut hasher = Keccak256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("keccak256".to_string(), hash);
    
    results
}

#[tauri::command]
fn hash_file(path: &str, lowercase: bool) -> Result<HashMap<String, String>, String> {
    println!("hash_file called with: {} (lowercase: {})", path, lowercase);
    
    // Read file content
    let mut file = File::open(path).map_err(|e| {
        let error_msg = format!("Failed to open file: {}", e);
        println!("Error: {}", error_msg);
        error_msg
    })?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| {
        let error_msg = format!("Failed to read file: {}", e);
        println!("Error: {}", error_msg);
        error_msg
    })?;
    
    println!("File read successfully, size: {} bytes", buffer.len());
    
    let mut results = HashMap::new();
    
    // MD2
    let mut hasher = Md2::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("md2".to_string(), hash);
    
    // MD4
    let mut hasher = Md4::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("md4".to_string(), hash);
    
    // MD5
    let digest = md5::compute(&buffer);
    let hash = if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) };
    results.insert("md5".to_string(), hash);
    
    // SHA1
    let mut hasher = Sha1::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha1".to_string(), hash);
    
    // SHA224
    let mut hasher = Sha224::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha224".to_string(), hash);
    
    // SHA256
    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha256".to_string(), hash);
    
    // SHA384
    let mut hasher = Sha384::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha384".to_string(), hash);
    
    // SHA512
    let mut hasher = Sha512::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("sha512".to_string(), hash);
    
    // Keccak-256
    let mut hasher = Keccak256::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
    results.insert("keccak256".to_string(), hash);
    
    println!("Hash calculation completed, returning {} results", results.len());
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
