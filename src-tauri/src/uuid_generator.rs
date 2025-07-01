use serde::{Deserialize, Serialize};
use uuid::{Uuid, Version};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedUuid {
    pub is_valid: bool,
    pub standard_format: String,
    pub raw_contents: String,
    pub version: String,
    pub variant: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateOptions {
    pub format: String, // "standard", "no-hyphens", "uppercase", "uppercase-no-hyphens"
    pub count: usize,
}

#[tauri::command]
pub fn parse_uuid(uuid: String) -> Result<ParsedUuid, String> {
    let trimmed = uuid.trim();
    
    match Uuid::parse_str(trimmed) {
        Ok(parsed_uuid) => {
            let version = match parsed_uuid.get_version() {
                Some(Version::Nil) => "Nil".to_string(),
                Some(Version::Random) => "4 (random)".to_string(),
                Some(Version::Md5) => "3 (MD5)".to_string(),
                Some(Version::Sha1) => "5 (SHA-1)".to_string(),
                Some(Version::Mac) => "1 (MAC address)".to_string(),
                _ => {
                    // Check if it's v7 by looking at the version number
                    let version_num = parsed_uuid.get_version_num();
                    if version_num == 7 {
                        "7 (sortable random)".to_string()
                    } else {
                        format!("Version {}", version_num)
                    }
                }
            };

            let variant = match parsed_uuid.get_variant() {
                uuid::Variant::NCS => "NCS".to_string(),
                uuid::Variant::RFC4122 => "Standard (DCE 1.1, ISO/IEC 11578:1996)".to_string(),
                uuid::Variant::Microsoft => "Microsoft".to_string(),
                uuid::Variant::Future => "Future".to_string(),
                _ => "Unknown".to_string(),
            };

            Ok(ParsedUuid {
                is_valid: true,
                standard_format: parsed_uuid.hyphenated().to_string(),
                raw_contents: parsed_uuid.simple().to_string(),
                version,
                variant,
                error_message: None,
            })
        }
        Err(e) => Err(format!("Invalid UUID: {}", e)),
    }
}

#[tauri::command]
pub fn generate_uuids(version: String, options: GenerateOptions) -> Result<Vec<String>, String> {
    let mut results = Vec::with_capacity(options.count);
    
    for _ in 0..options.count {
        let uuid = match version.as_str() {
            "v1" => {
                // Generate v1 UUID with a dummy node ID
                // Note: This requires the v1 feature which we have enabled
                let node_id = [1, 2, 3, 4, 5, 6]; // Dummy MAC address
                Uuid::new_v1(
                    uuid::Timestamp::now(uuid::NoContext),
                    &node_id
                )
            }
            "v3" => {
                // Using DNS namespace with example.com
                Uuid::new_v3(&Uuid::NAMESPACE_DNS, b"example.com")
            }
            "v4" => Uuid::new_v4(),
            "v5" => {
                // Using DNS namespace with example.com
                Uuid::new_v5(&Uuid::NAMESPACE_DNS, b"example.com")
            }
            "v7" => {
                // For now, use v4 as a fallback since v7 might not be available
                // TODO: Update when uuid crate supports v7
                Uuid::new_v4()
            }
            _ => return Err("Unsupported UUID version".to_string()),
        };

        let formatted = match options.format.as_str() {
            "standard" => uuid.hyphenated().to_string(),
            "no-hyphens" => uuid.simple().to_string(),
            "uppercase" => uuid.hyphenated().to_string().to_uppercase(),
            "uppercase-no-hyphens" => uuid.simple().to_string().to_uppercase(),
            _ => uuid.hyphenated().to_string(),
        };

        results.push(formatted);
    }
    
    Ok(results)
}
