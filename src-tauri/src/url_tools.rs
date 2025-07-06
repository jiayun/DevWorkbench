use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;
use percent_encoding::{percent_encode, percent_decode_str, NON_ALPHANUMERIC};

#[derive(Serialize, Deserialize)]
pub struct UrlParts {
    pub protocol: String,
    pub username: String,
    pub password: String,
    pub hostname: String,
    pub port: String,
    pub pathname: String,
    pub search: String,
    pub hash: String,
}

#[derive(Serialize, Deserialize)]
pub struct ParsedUrlResult {
    pub parts: UrlParts,
    pub params: HashMap<String, serde_json::Value>,
}

#[tauri::command]
pub fn process_url_encode_decode(input: &str, mode: &str) -> Result<String, String> {
    match mode {
        "encode" => {
            // URL encode the input
            let encoded = percent_encode(input.as_bytes(), NON_ALPHANUMERIC).to_string();
            Ok(encoded)
        }
        "decode" => {
            // URL decode the input
            match percent_decode_str(input).decode_utf8() {
                Ok(decoded) => Ok(decoded.to_string()),
                Err(e) => Err(format!("Failed to decode: {}", e)),
            }
        }
        _ => Err("Invalid mode. Use 'encode' or 'decode'.".to_string()),
    }
}

#[tauri::command]
pub fn parse_url(url: &str) -> Result<ParsedUrlResult, String> {
    match Url::parse(url) {
        Ok(parsed) => {
            let mut params = HashMap::new();
            
            // Parse query parameters
            if let Some(query) = parsed.query() {
                for pair in query.split('&') {
                    if let Some(eq_pos) = pair.find('=') {
                        let key = &pair[..eq_pos];
                        let value = &pair[eq_pos + 1..];
                        
                        // Decode the value
                        if let Ok(decoded_value) = percent_decode_str(value).decode_utf8() {
                            let decoded_key = percent_decode_str(key).decode_utf8()
                                .unwrap_or_else(|_| std::borrow::Cow::Borrowed(key));
                            
                            // Check if key already exists (for array values)
                            if let Some(existing) = params.get_mut(decoded_key.as_ref()) {
                                // Convert to array if not already
                                match existing {
                                    serde_json::Value::Array(arr) => {
                                        arr.push(serde_json::Value::String(decoded_value.to_string()));
                                    }
                                    _ => {
                                        let prev = existing.clone();
                                        *existing = serde_json::Value::Array(vec![
                                            prev,
                                            serde_json::Value::String(decoded_value.to_string())
                                        ]);
                                    }
                                }
                            } else {
                                params.insert(
                                    decoded_key.to_string(),
                                    serde_json::Value::String(decoded_value.to_string())
                                );
                            }
                        }
                    } else {
                        // Handle keys without values
                        let decoded_key = percent_decode_str(pair).decode_utf8()
                            .unwrap_or_else(|_| std::borrow::Cow::Borrowed(pair));
                        params.insert(decoded_key.to_string(), serde_json::Value::String("".to_string()));
                    }
                }
            }
            
            let parts = UrlParts {
                protocol: parsed.scheme().to_string(),
                username: parsed.username().to_string(),
                password: parsed.password().unwrap_or("").to_string(),
                hostname: parsed.host_str().unwrap_or("").to_string(),
                port: parsed.port().map(|p| p.to_string()).unwrap_or_default(),
                pathname: parsed.path().to_string(),
                search: parsed.query().unwrap_or("").to_string(),
                hash: parsed.fragment().unwrap_or("").to_string(),
            };
            
            Ok(ParsedUrlResult { parts, params })
        }
        Err(e) => Err(format!("Failed to parse URL: {}", e)),
    }
}

#[tauri::command]
pub fn build_url(parts: UrlParts) -> Result<String, String> {
    let mut url_string = String::new();
    
    // Start with protocol
    if !parts.protocol.is_empty() {
        url_string.push_str(&parts.protocol);
        if !parts.protocol.ends_with("://") {
            url_string.push_str("://");
        }
    } else {
        return Err("Protocol is required".to_string());
    }
    
    // Add credentials if present
    if !parts.username.is_empty() {
        url_string.push_str(&percent_encode(parts.username.as_bytes(), NON_ALPHANUMERIC).to_string());
        if !parts.password.is_empty() {
            url_string.push(':');
            url_string.push_str(&percent_encode(parts.password.as_bytes(), NON_ALPHANUMERIC).to_string());
        }
        url_string.push('@');
    }
    
    // Add hostname
    if !parts.hostname.is_empty() {
        url_string.push_str(&parts.hostname);
    } else {
        return Err("Hostname is required".to_string());
    }
    
    // Add port if present
    if !parts.port.is_empty() {
        url_string.push(':');
        url_string.push_str(&parts.port);
    }
    
    // Add pathname
    if !parts.pathname.is_empty() {
        if !parts.pathname.starts_with('/') {
            url_string.push('/');
        }
        url_string.push_str(&parts.pathname);
    }
    
    // Add query parameters
    if !parts.search.is_empty() {
        url_string.push('?');
        
        // Process each line as a key=value pair
        let mut params = Vec::new();
        for line in parts.search.lines() {
            let line = line.trim();
            if !line.is_empty() {
                if let Some(eq_pos) = line.find('=') {
                    let key = &line[..eq_pos];
                    let value = &line[eq_pos + 1..];
                    let encoded_key = percent_encode(key.as_bytes(), NON_ALPHANUMERIC).to_string();
                    let encoded_value = percent_encode(value.as_bytes(), NON_ALPHANUMERIC).to_string();
                    params.push(format!("{}={}", encoded_key, encoded_value));
                } else {
                    // Key without value
                    let encoded_key = percent_encode(line.as_bytes(), NON_ALPHANUMERIC).to_string();
                    params.push(encoded_key);
                }
            }
        }
        url_string.push_str(&params.join("&"));
    }
    
    // Add hash/fragment
    if !parts.hash.is_empty() {
        url_string.push('#');
        if parts.hash.starts_with('#') {
            url_string.push_str(&parts.hash[1..]);
        } else {
            url_string.push_str(&parts.hash);
        }
    }
    
    // Validate the built URL
    match Url::parse(&url_string) {
        Ok(_) => Ok(url_string),
        Err(e) => Err(format!("Invalid URL: {}", e)),
    }
}
