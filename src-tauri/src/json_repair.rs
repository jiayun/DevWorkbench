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
        if let Ok(serde_json::Value::String(unescaped)) =
            serde_json::from_str::<serde_json::Value>(trimmed)
        {
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

/// Convert Python/JavaScript-like single quoted strings to JSON strings.
///
/// This only treats `'` as a string delimiter when it appears outside a double
/// quoted JSON string. The collected string value is serialized through
/// serde_json so embedded double quotes and control characters are escaped
/// correctly.
fn normalize_single_quoted_strings(input: &str) -> Option<String> {
    if !input.contains('\'') {
        return None;
    }

    let mut output = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();
    let mut in_double_string = false;
    let mut double_escape_next = false;
    let mut changed = false;

    while let Some(ch) = chars.next() {
        if in_double_string {
            output.push(ch);
            if double_escape_next {
                double_escape_next = false;
            } else if ch == '\\' {
                double_escape_next = true;
            } else if ch == '"' {
                in_double_string = false;
            }
            continue;
        }

        match ch {
            '"' => {
                in_double_string = true;
                output.push(ch);
            }
            '\'' => {
                let mut value = String::new();
                let mut closed = false;

                while let Some(inner) = chars.next() {
                    if inner == '\\' {
                        match chars.next() {
                            Some('\'') => value.push('\''),
                            Some('\\') => value.push('\\'),
                            Some('"') => value.push('"'),
                            Some('/') => value.push('/'),
                            Some('n') => value.push('\n'),
                            Some('r') => value.push('\r'),
                            Some('t') => value.push('\t'),
                            Some('b') => value.push('\u{0008}'),
                            Some('f') => value.push('\u{000c}'),
                            Some(other) => {
                                value.push('\\');
                                value.push(other);
                            }
                            None => {
                                value.push('\\');
                                break;
                            }
                        }
                    } else if inner == '\'' {
                        closed = true;
                        break;
                    } else {
                        value.push(inner);
                    }
                }

                if !closed {
                    return None;
                }

                output.push_str(&serde_json::to_string(&value).ok()?);
                changed = true;
            }
            _ => output.push(ch),
        }
    }

    if changed {
        Some(output)
    } else {
        None
    }
}

/// Collect parse errors from serde_json to show what was wrong
fn collect_parse_errors(input: &str) -> Vec<String> {
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(_) => vec![],
        Err(e) => {
            let mut errors = Vec::new();
            errors.push(format!(
                "{} at line: {}, column: {}",
                e,
                e.line(),
                e.column()
            ));
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
    if original.contains(",]")
        || original.contains(",}")
        || original.contains(", ]")
        || original.contains(", }")
    {
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

fn validate_repaired_json(repaired: String, original: &str) -> Result<RepairJsonResult, String> {
    serde_json::from_str::<serde_json::Value>(&repaired)
        .map_err(|e| format!("Repair produced invalid JSON: {}", e))?;

    let issues = detect_issues(original, &repaired);
    Ok(RepairJsonResult {
        repaired,
        was_repaired: true,
        issues,
    })
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

    // 3. Normalize Python/JavaScript-like single quoted strings before using
    // the broader repairer. This handles dict-like payloads while preserving
    // double quotes inside the string values.
    if let Some(normalized) = normalize_single_quoted_strings(trimmed) {
        if let Ok(result) = validate_repaired_json(normalized.clone(), trimmed) {
            return Ok(result);
        }

        if let Ok(repaired) = anyrepair::jsonrepair(&normalized) {
            return validate_repaired_json(repaired, trimmed);
        }
    }

    // 4. Use anyrepair for other issues
    match anyrepair::jsonrepair(trimmed) {
        Ok(repaired) => validate_repaired_json(repaired, trimmed),
        Err(e) => Err(format!("Unable to repair JSON: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    #[test]
    fn repairs_python_dict_like_payload_with_nested_double_quotes() {
        let input = r#"{'bucket': 'sampleCollection', 'origin': 'scenario-builder', 'searchExpression': '+(CATEGORY_CODE:(41001 41002) CATEGORY_LABEL:("Alpha Value" "Beta Value" "Gamma Value") TITLE_TEXT:("Alpha Value" "Beta Value" "Gamma Value")^25) +(REGION_CODE:(9001???) REGION_LABEL:("North Zone")) +((+FLAG_A:enabled)) +(RANGE_WINDOW:[10 TO 20]) +(GROUP_TYPE:(2 8)) +(OPTION_A:(true)) +(OPTION_B:(512)) +(OPTION_LEVEL:(3)) (TOPIC_CODE:(7705???) TOPIC_LABEL:("Data Systems")) +(ENTITY_NAME:("Example Institute") ENTITY_ALIAS:("Example Institute") ENTITY_LINK:("Example Institute"))', 'offset': 0, 'limit': 0, 'fields': ['ITEM_ID'], 'exclusion': '*:* -ITEM_ID:(10001 10002 10003 10004 10005 10006)'}"#;

        let result = repair_json(input.to_string()).expect("dict-like input should repair");
        let parsed: Value =
            serde_json::from_str(&result.repaired).expect("repaired JSON should parse");

        assert!(result.was_repaired);
        assert_eq!(parsed["bucket"], "sampleCollection");
        assert_eq!(parsed["origin"], "scenario-builder");
        assert_eq!(parsed["offset"], 0);
        assert_eq!(parsed["limit"], 0);
        assert_eq!(parsed["fields"][0], "ITEM_ID");
        assert!(parsed["searchExpression"]
            .as_str()
            .expect("searchExpression should be a string")
            .contains(r#"TITLE_TEXT:("Alpha Value" "Beta Value" "Gamma Value")"#));
    }

    #[test]
    fn keeps_valid_json_unrepaired() {
        let result = repair_json(r#"{"bucket":"sampleCollection"}"#.to_string()).unwrap();

        assert!(!result.was_repaired);
        assert_eq!(result.repaired, r#"{"bucket":"sampleCollection"}"#);
        assert!(result.issues.is_empty());
    }

    #[test]
    fn repairs_single_quoted_string_escapes() {
        let result = repair_json(r#"{'text': 'Bob\'s job', 'path': 'C:\\tmp'}"#.to_string())
            .expect("escaped single quotes should repair");
        let parsed: Value = serde_json::from_str(&result.repaired).unwrap();

        assert_eq!(parsed["text"], "Bob's job");
        assert_eq!(parsed["path"], r#"C:\tmp"#);
    }
}
