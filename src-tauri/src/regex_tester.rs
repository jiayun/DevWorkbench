use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct RegexMatch {
    pub full_match: String,
    pub start: usize,
    pub end: usize,
    pub groups: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct TestResult {
    pub matches: Vec<RegexMatch>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ReplaceResult {
    pub result: String,
    pub count: usize,
    pub error: Option<String>,
}

fn build_regex(pattern: &str, flags: &str) -> Result<Regex, String> {
    let mut builder = RegexBuilder::new(pattern);
    
    // Parse flags
    for flag in flags.chars() {
        match flag {
            'i' => { builder.case_insensitive(true); }
            'm' => { builder.multi_line(true); }
            's' => { builder.dot_matches_new_line(true); }
            'x' => { builder.ignore_whitespace(true); }
            'g' => { /* Global flag is handled in the matching logic */ }
            _ => { /* Ignore unknown flags */ }
        }
    }
    
    builder.build().map_err(|e| format!("Invalid regex pattern: {}", e))
}

#[tauri::command]
pub fn test_regex(pattern: &str, text: &str, flags: &str) -> TestResult {
    match build_regex(pattern, flags) {
        Ok(re) => {
            let mut matches = Vec::new();
            let is_global = flags.contains('g');
            
            if is_global {
                // Find all matches
                for mat in re.find_iter(text) {
                    let full_match = mat.as_str().to_string();
                    let start = mat.start();
                    let end = mat.end();
                    
                    // Get capture groups
                    let mut groups = Vec::new();
                    if let Some(captures) = re.captures_at(text, start) {
                        // Skip the first capture (full match) and collect groups
                        for i in 1..captures.len() {
                            if let Some(group) = captures.get(i) {
                                groups.push(group.as_str().to_string());
                            }
                        }
                    }
                    
                    matches.push(RegexMatch {
                        full_match,
                        start,
                        end,
                        groups,
                    });
                }
            } else {
                // Find only the first match
                if let Some(mat) = re.find(text) {
                    let full_match = mat.as_str().to_string();
                    let start = mat.start();
                    let end = mat.end();
                    
                    // Get capture groups
                    let mut groups = Vec::new();
                    if let Some(captures) = re.captures(text) {
                        // Skip the first capture (full match) and collect groups
                        for i in 1..captures.len() {
                            if let Some(group) = captures.get(i) {
                                groups.push(group.as_str().to_string());
                            }
                        }
                    }
                    
                    matches.push(RegexMatch {
                        full_match,
                        start,
                        end,
                        groups,
                    });
                }
            }
            
            TestResult {
                matches,
                error: None,
            }
        }
        Err(e) => TestResult {
            matches: Vec::new(),
            error: Some(e),
        }
    }
}

#[tauri::command]
pub fn replace_regex(pattern: &str, text: &str, replacement: &str, flags: &str) -> ReplaceResult {
    match build_regex(pattern, flags) {
        Ok(re) => {
            let is_global = flags.contains('g');
            let mut count = 0;
            
            let result = if is_global {
                // Count matches before replacement
                count = re.find_iter(text).count();
                re.replace_all(text, replacement).to_string()
            } else {
                // For non-global, count is 0 or 1
                if re.is_match(text) {
                    count = 1;
                }
                re.replace(text, replacement).to_string()
            };
            
            ReplaceResult {
                result,
                count,
                error: None,
            }
        }
        Err(e) => ReplaceResult {
            result: String::new(),
            count: 0,
            error: Some(e),
        }
    }
}
