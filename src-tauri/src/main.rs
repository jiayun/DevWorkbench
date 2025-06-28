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
use std::thread;

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
    let mut handles = Vec::new();
    let mut results = HashMap::new();
    
    // Create a channel to collect results from threads
    let (tx, rx) = std::sync::mpsc::channel::<(String, String)>();
    
    // MD2
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Md2::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("md2".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // MD4
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Md4::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("md4".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // MD5
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let digest = md5::compute(&*bytes);
            let hash = if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) };
            tx.send(("md5".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA1
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha1::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha1".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA224
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha224::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha224".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA256
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha256::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha256".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA384
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha384::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha384".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA512
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha512::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha512".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // Keccak-256
    {
        let bytes = Arc::clone(&bytes);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Keccak256::new();
            hasher.update(&*bytes);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("keccak256".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // Drop the original sender so the receiver knows when all threads are done
    drop(tx);
    
    // Collect all results
    while let Ok((algorithm, hash)) = rx.recv() {
        results.insert(algorithm, hash);
    }
    
    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }
    
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
    
    // Use Arc to share the buffer between threads
    let buffer = Arc::new(buffer);
    let mut handles = Vec::new();
    let mut results = HashMap::new();
    
    // Create a vector to collect results from threads
    let (tx, rx) = std::sync::mpsc::channel::<(String, String)>();
    
    // MD2
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Md2::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("md2".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // MD4
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Md4::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("md4".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // MD5
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let digest = md5::compute(&*buffer);
            let hash = if lowercase { format!("{:x}", digest) } else { format!("{:X}", digest) };
            tx.send(("md5".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA1
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha1::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha1".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA224
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha224::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha224".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA256
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha256::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha256".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA384
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha384::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha384".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // SHA512
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Sha512::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("sha512".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // Keccak-256
    {
        let buffer = Arc::clone(&buffer);
        let tx = tx.clone();
        let handle = thread::spawn(move || {
            let mut hasher = Keccak256::new();
            hasher.update(&*buffer);
            let result = hasher.finalize();
            let hash = if lowercase { hex::encode(&result) } else { hex::encode(&result).to_uppercase() };
            tx.send(("keccak256".to_string(), hash)).unwrap();
        });
        handles.push(handle);
    }
    
    // Drop the original sender so the receiver knows when all threads are done
    drop(tx);
    
    // Collect all results
    while let Ok((algorithm, hash)) = rx.recv() {
        results.insert(algorithm, hash);
    }
    
    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("Parallel hash calculation completed, returning {} results", results.len());
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
