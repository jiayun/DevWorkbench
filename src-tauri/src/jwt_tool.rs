use chrono::{DateTime, Utc};
use jsonwebtoken::{
    decode, decode_header, encode, Algorithm, DecodingKey, EncodingKey, Header,
    Validation,
};
use rsa::{
    pkcs1::{DecodeRsaPrivateKey, DecodeRsaPublicKey, EncodeRsaPrivateKey, EncodeRsaPublicKey},
    pkcs8::LineEnding,
    RsaPrivateKey, RsaPublicKey,
};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::time::{SystemTime, UNIX_EPOCH};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JwtParts {
    header: Map<String, Value>,
    payload: Map<String, Value>,
    signature: String,
    is_expired: bool,
    expires_at: Option<i64>,
    issued_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyResult {
    is_valid: bool,
    error: Option<String>,
    decoded_header: Option<Map<String, Value>>,
    decoded_payload: Option<Map<String, Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyPair {
    private_key: String,
    public_key: String,
}

#[tauri::command]
pub fn decode_jwt(token: &str) -> Result<JwtParts, String> {
    // Remove Bearer prefix if present
    let token = token.trim();
    let token = if token.starts_with("Bearer ") {
        &token[7..]
    } else {
        token
    };

    // Split token into parts
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Err("Invalid JWT format. Expected 3 parts separated by dots.".to_string());
    }

    // Decode header
    let header = decode_header(token).map_err(|e| format!("Failed to decode header: {}", e))?;
    let header_json = serde_json::to_value(&header)
        .map_err(|e| format!("Failed to serialize header: {}", e))?;
    let header_map = header_json
        .as_object()
        .ok_or("Header is not an object")?
        .clone();

    // Decode payload without verification
    let payload_bytes = URL_SAFE_NO_PAD.decode(parts[1])
        .map_err(|e| format!("Failed to decode payload: {}", e))?;
    let payload_str = String::from_utf8(payload_bytes)
        .map_err(|e| format!("Invalid UTF-8 in payload: {}", e))?;
    let payload: Map<String, Value> = serde_json::from_str(&payload_str)
        .map_err(|e| format!("Failed to parse payload JSON: {}", e))?;

    // Check expiration
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    let expires_at = payload.get("exp").and_then(|v| v.as_i64());
    let issued_at = payload.get("iat").and_then(|v| v.as_i64());
    let is_expired = expires_at.map(|exp| now > exp).unwrap_or(false);

    // Get signature
    let signature = parts[2].to_string();

    Ok(JwtParts {
        header: header_map,
        payload,
        signature,
        is_expired,
        expires_at,
        issued_at,
    })
}

#[tauri::command]
pub fn encode_jwt(
    payload: Map<String, Value>,
    secret: &str,
    algorithm: &str,
) -> Result<String, String> {
    let alg = match algorithm {
        "HS256" => Algorithm::HS256,
        "HS384" => Algorithm::HS384,
        "HS512" => Algorithm::HS512,
        "RS256" => Algorithm::RS256,
        "RS384" => Algorithm::RS384,
        "RS512" => Algorithm::RS512,
        _ => return Err(format!("Unsupported algorithm: {}", algorithm)),
    };

    let header = Header::new(alg);
    
    let key = match algorithm {
        "HS256" | "HS384" | "HS512" => EncodingKey::from_secret(secret.as_bytes()),
        "RS256" | "RS384" | "RS512" => {
            let private_key = RsaPrivateKey::from_pkcs1_pem(secret)
                .map_err(|e| format!("Failed to parse RSA private key: {}", e))?;
            let pem = private_key
                .to_pkcs1_pem(LineEnding::LF)
                .map_err(|e| format!("Failed to encode private key: {}", e))?;
            EncodingKey::from_rsa_pem(pem.as_bytes())
                .map_err(|e| format!("Failed to create encoding key: {}", e))?
        }
        _ => return Err(format!("Unsupported algorithm: {}", algorithm)),
    };

    encode(&header, &payload, &key).map_err(|e| format!("Failed to encode JWT: {}", e))
}

#[tauri::command]
pub fn verify_jwt(token: &str, secret: &str, algorithm: &str) -> Result<VerifyResult, String> {
    let token = token.trim();
    let token = if token.starts_with("Bearer ") {
        &token[7..]
    } else {
        token
    };

    let alg = match algorithm {
        "HS256" => Algorithm::HS256,
        "HS384" => Algorithm::HS384,
        "HS512" => Algorithm::HS512,
        "RS256" => Algorithm::RS256,
        "RS384" => Algorithm::RS384,
        "RS512" => Algorithm::RS512,
        _ => {
            return Ok(VerifyResult {
                is_valid: false,
                error: Some(format!("Unsupported algorithm: {}", algorithm)),
                decoded_header: None,
                decoded_payload: None,
            })
        }
    };

    let mut validation = Validation::new(alg);
    validation.validate_exp = false; // We'll check expiry separately for better error messages

    let key = match algorithm {
        "HS256" | "HS384" | "HS512" => DecodingKey::from_secret(secret.as_bytes()),
        "RS256" | "RS384" | "RS512" => {
            // Try parsing as public key first
            match RsaPublicKey::from_pkcs1_pem(secret) {
                Ok(public_key) => {
                    let pem = public_key
                        .to_pkcs1_pem(LineEnding::LF)
                        .map_err(|e| format!("Failed to encode public key: {}", e))?;
                    DecodingKey::from_rsa_pem(pem.as_bytes())
                        .map_err(|e| format!("Failed to create decoding key: {}", e))?
                }
                Err(_) => {
                    // Try parsing as private key and extract public key
                    let private_key = RsaPrivateKey::from_pkcs1_pem(secret).map_err(|e| {
                        format!("Failed to parse RSA key: {}", e)
                    })?;
                    let public_key = RsaPublicKey::from(&private_key);
                    let pem = public_key
                        .to_pkcs1_pem(LineEnding::LF)
                        .map_err(|e| format!("Failed to encode public key: {}", e))?;
                    DecodingKey::from_rsa_pem(pem.as_bytes())
                        .map_err(|e| format!("Failed to create decoding key: {}", e))?
                }
            }
        }
        _ => {
            return Ok(VerifyResult {
                is_valid: false,
                error: Some(format!("Unsupported algorithm: {}", algorithm)),
                decoded_header: None,
                decoded_payload: None,
            })
        }
    };

    match decode::<Map<String, Value>>(token, &key, &validation) {
        Ok(token_data) => {
            // Check expiration manually
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;
            
            if let Some(exp) = token_data.claims.get("exp").and_then(|v| v.as_i64()) {
                if now > exp {
                    return Ok(VerifyResult {
                        is_valid: false,
                        error: Some(format!(
                            "Token expired at {}",
                            DateTime::<Utc>::from_timestamp(exp, 0)
                                .map(|dt| dt.to_rfc3339())
                                .unwrap_or_else(|| exp.to_string())
                        )),
                        decoded_header: Some(
                            serde_json::to_value(&token_data.header)
                                .ok()
                                .and_then(|v| v.as_object().cloned())
                                .unwrap_or_default(),
                        ),
                        decoded_payload: Some(token_data.claims),
                    });
                }
            }

            let header_map = serde_json::to_value(&token_data.header)
                .ok()
                .and_then(|v| v.as_object().cloned());

            Ok(VerifyResult {
                is_valid: true,
                error: None,
                decoded_header: header_map,
                decoded_payload: Some(token_data.claims),
            })
        }
        Err(e) => Ok(VerifyResult {
            is_valid: false,
            error: Some(format!("Verification failed: {}", e)),
            decoded_header: None,
            decoded_payload: None,
        }),
    }
}

#[tauri::command]
pub fn generate_rsa_keypair(key_size: usize) -> Result<KeyPair, String> {
    use rand::rngs::OsRng;

    let bits = match key_size {
        2048 | 3072 | 4096 => key_size,
        _ => return Err("Key size must be 2048, 3072, or 4096 bits".to_string()),
    };

    let private_key = RsaPrivateKey::new(&mut OsRng, bits)
        .map_err(|e| format!("Failed to generate private key: {}", e))?;
    
    let public_key = RsaPublicKey::from(&private_key);

    let private_pem = private_key
        .to_pkcs1_pem(LineEnding::LF)
        .map_err(|e| format!("Failed to encode private key: {}", e))?;

    let public_pem = public_key
        .to_pkcs1_pem(LineEnding::LF)
        .map_err(|e| format!("Failed to encode public key: {}", e))?;

    Ok(KeyPair {
        private_key: private_pem.to_string(),
        public_key: public_pem,
    })
}

#[tauri::command]
pub fn generate_jwt_secret(length: usize) -> Result<String, String> {
    use rand::{distributions::Alphanumeric, Rng};
    
    if length < 32 {
        return Err("Secret length must be at least 32 characters".to_string());
    }
    
    let secret: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(length)
        .map(char::from)
        .collect();
    
    Ok(secret)
}
