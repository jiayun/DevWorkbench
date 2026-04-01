use serde::Serialize;

#[derive(Serialize)]
pub struct RepairJsonResult {
    repaired: String,
    was_repaired: bool,
    issues: Vec<String>,
}

/// Try to unescape a JSON string that has escaped quotes (e.g. {\"key\":\"value\"})
fn try_unescape(input: &str) -> Option<String> {
    let trimmed = input.trim();

    // Case 1: wrapped in quotes like "{\"key\":\"value\"}"
    if trimmed.starts_with('"') && trimmed.ends_with('"') {
        if let Ok(serde_json::Value::String(unescaped)) = serde_json::from_str::<serde_json::Value>(trimmed) {
            if serde_json::from_str::<serde_json::Value>(&unescaped).is_ok() {
                return Some(unescaped);
            }
        }
    }

    // Case 2: contains escaped quotes like {\"key\":\"value\"} without outer wrapping
    if trimmed.contains("\\\"") {
        let unescaped = trimmed
            .replace("\\\"", "\"")
            .replace("\\\\", "\\")
            .replace("\\/", "/");
        if serde_json::from_str::<serde_json::Value>(&unescaped).is_ok() {
            return Some(unescaped);
        }
    }

    None
}

/// Collect parse errors from serde_json to show what was wrong
fn collect_parse_errors(input: &str) -> Vec<String> {
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(_) => vec![],
        Err(e) => {
            let mut errors = Vec::new();
            errors.push(format!("{} at line: {}, column: {}", e, e.line(), e.column()));
            errors
        }
    }
}

/// Detect what issues were fixed by comparing original input to repaired output
fn detect_issues(original: &str, repaired: &str) -> Vec<String> {
    // Start with original parse errors
    let mut issues = collect_parse_errors(original);

    // Add repair descriptions
    if original.contains("\\\"") && !repaired.contains("\\\"") {
        issues.push("Repaired: Unescaped escaped JSON string".to_string());
    }
    if original.contains("//") || original.contains("/*") {
        if !repaired.contains("//") && !repaired.contains("/*") {
            issues.push("Repaired: Removed comments".to_string());
        }
    }
    if original.contains(",]") || original.contains(",}") || original.contains(", ]") || original.contains(", }") {
        issues.push("Repaired: Removed trailing commas".to_string());
    }

    let orig_single_count = original.matches('\'').count();
    let repaired_single_count = repaired.matches('\'').count();
    if orig_single_count > repaired_single_count && orig_single_count >= 2 {
        issues.push("Repaired: Replaced single quotes with double quotes".to_string());
    }

    // If no specific repair was detected but input changed
    if issues.len() <= 1 && original != repaired {
        issues.push("Repaired: Fixed JSON syntax errors".to_string());
    }

    issues
}

#[tauri::command]
pub fn repair_json(input: String) -> Result<RepairJsonResult, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("Empty input".to_string());
    }

    // 1. Try standard parse first
    if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
        return Ok(RepairJsonResult {
            repaired: trimmed.to_string(),
            was_repaired: false,
            issues: vec![],
        });
    }

    // 2. Try unescape (primary use case: escaped JSON strings)
    if let Some(unescaped) = try_unescape(trimmed) {
        let mut issues = collect_parse_errors(trimmed);
        issues.push("Repaired: Unescaped escaped JSON string".to_string());
        return Ok(RepairJsonResult {
            repaired: unescaped,
            was_repaired: true,
            issues,
        });
    }

    // 3. Use anyrepair for other issues
    match anyrepair::jsonrepair(trimmed) {
        Ok(repaired) => {
            let issues = detect_issues(trimmed, &repaired);
            Ok(RepairJsonResult {
                repaired,
                was_repaired: true,
                issues,
            })
        }
        Err(e) => Err(format!("Unable to repair JSON: {}", e)),
    }
}
