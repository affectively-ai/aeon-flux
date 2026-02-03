//! Component Hydration for Aeon Pages
//!
//! Handles serialization and deserialization of React component trees
//! for storage in Aeon sessions and rendering on client/server.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Component registry - maps component names to their render functions
#[wasm_bindgen]
pub struct ComponentRegistry {
    /// Registered component names (actual render functions are in JS)
    components: HashMap<String, bool>,
}

#[wasm_bindgen]
impl ComponentRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            components: HashMap::new(),
        }
    }

    /// Register a component as available for rendering
    pub fn register(&mut self, name: &str) {
        self.components.insert(name.to_string(), true);
    }

    /// Check if a component is registered
    pub fn has(&self, name: &str) -> bool {
        self.components.contains_key(name)
    }

    /// Get all registered component names
    pub fn list(&self) -> String {
        let names: Vec<&String> = self.components.keys().collect();
        serde_json::to_string(&names).unwrap_or_else(|_| "[]".to_string())
    }

    /// Register multiple components at once (from JSON array)
    pub fn register_many(&mut self, names_json: &str) {
        if let Ok(names) = serde_json::from_str::<Vec<String>>(names_json) {
            for name in names {
                self.register(&name);
            }
        }
    }
}

impl Default for ComponentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Diff result for component tree changes
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TreeDiff {
    /// Path to the changed node (e.g., "children.0.props.text")
    path: String,
    /// Type of change: "add", "remove", "update"
    change_type: String,
    /// Old value (JSON)
    old_value: Option<String>,
    /// New value (JSON)
    new_value: Option<String>,
}

#[wasm_bindgen]
impl TreeDiff {
    #[wasm_bindgen(constructor)]
    pub fn new(
        path: String,
        change_type: String,
        old_value: Option<String>,
        new_value: Option<String>,
    ) -> Self {
        Self {
            path,
            change_type,
            old_value,
            new_value,
        }
    }

    /// Get the path
    #[wasm_bindgen(getter)]
    pub fn path(&self) -> String {
        self.path.clone()
    }

    /// Get the change type
    #[wasm_bindgen(getter)]
    pub fn change_type(&self) -> String {
        self.change_type.clone()
    }

    /// Get the old value
    #[wasm_bindgen(getter)]
    pub fn old_value(&self) -> Option<String> {
        self.old_value.clone()
    }

    /// Get the new value
    #[wasm_bindgen(getter)]
    pub fn new_value(&self) -> Option<String> {
        self.new_value.clone()
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }
}

/// Compute diff between two component trees
#[wasm_bindgen]
pub fn diff_trees(old_json: &str, new_json: &str) -> String {
    let diffs = compute_diff(old_json, new_json, "");
    serde_json::to_string(&diffs).unwrap_or_else(|_| "[]".to_string())
}

/// Internal diff computation
fn compute_diff(old_json: &str, new_json: &str, path: &str) -> Vec<TreeDiff> {
    let mut diffs = Vec::new();

    let old: serde_json::Value = serde_json::from_str(old_json).unwrap_or(serde_json::Value::Null);
    let new: serde_json::Value = serde_json::from_str(new_json).unwrap_or(serde_json::Value::Null);

    diff_values(&old, &new, path, &mut diffs);
    diffs
}

fn diff_values(old: &serde_json::Value, new: &serde_json::Value, path: &str, diffs: &mut Vec<TreeDiff>) {
    use serde_json::Value;

    match (old, new) {
        (Value::Null, Value::Null) => {}
        (Value::Null, _) => {
            diffs.push(TreeDiff::new(
                path.to_string(),
                "add".to_string(),
                None,
                Some(new.to_string()),
            ));
        }
        (_, Value::Null) => {
            diffs.push(TreeDiff::new(
                path.to_string(),
                "remove".to_string(),
                Some(old.to_string()),
                None,
            ));
        }
        (Value::Object(old_map), Value::Object(new_map)) => {
            // Check for removed keys
            for key in old_map.keys() {
                if !new_map.contains_key(key) {
                    let child_path = if path.is_empty() {
                        key.clone()
                    } else {
                        format!("{}.{}", path, key)
                    };
                    diffs.push(TreeDiff::new(
                        child_path,
                        "remove".to_string(),
                        Some(old_map[key].to_string()),
                        None,
                    ));
                }
            }
            // Check for added/changed keys
            for (key, new_val) in new_map {
                let child_path = if path.is_empty() {
                    key.clone()
                } else {
                    format!("{}.{}", path, key)
                };
                if let Some(old_val) = old_map.get(key) {
                    diff_values(old_val, new_val, &child_path, diffs);
                } else {
                    diffs.push(TreeDiff::new(
                        child_path,
                        "add".to_string(),
                        None,
                        Some(new_val.to_string()),
                    ));
                }
            }
        }
        (Value::Array(old_arr), Value::Array(new_arr)) => {
            let max_len = old_arr.len().max(new_arr.len());
            for i in 0..max_len {
                let child_path = if path.is_empty() {
                    format!("{}", i)
                } else {
                    format!("{}.{}", path, i)
                };
                let old_item = old_arr.get(i).unwrap_or(&Value::Null);
                let new_item = new_arr.get(i).unwrap_or(&Value::Null);
                diff_values(old_item, new_item, &child_path, diffs);
            }
        }
        _ => {
            if old != new {
                diffs.push(TreeDiff::new(
                    path.to_string(),
                    "update".to_string(),
                    Some(old.to_string()),
                    Some(new.to_string()),
                ));
            }
        }
    }
}

/// Apply a patch to a component tree
#[wasm_bindgen]
pub fn apply_patch(tree_json: &str, patch_json: &str) -> String {
    let mut tree: serde_json::Value = serde_json::from_str(tree_json)
        .unwrap_or(serde_json::Value::Null);

    let patches: Vec<TreeDiff> = serde_json::from_str(patch_json)
        .unwrap_or_default();

    for patch in patches {
        apply_single_patch(&mut tree, &patch);
    }

    serde_json::to_string(&tree).unwrap_or_else(|_| "{}".to_string())
}

fn apply_single_patch(tree: &mut serde_json::Value, patch: &TreeDiff) {
    let path_parts: Vec<&str> = patch.path.split('.').filter(|s| !s.is_empty()).collect();

    if path_parts.is_empty() {
        // Root-level change
        match patch.change_type.as_str() {
            "add" | "update" => {
                if let Some(new_val) = &patch.new_value {
                    if let Ok(val) = serde_json::from_str(new_val) {
                        *tree = val;
                    }
                }
            }
            "remove" => {
                *tree = serde_json::Value::Null;
            }
            _ => {}
        }
        return;
    }

    // Navigate to parent
    let mut current = tree;
    for (i, part) in path_parts.iter().enumerate() {
        if i == path_parts.len() - 1 {
            // This is the target
            match patch.change_type.as_str() {
                "add" | "update" => {
                    if let Some(new_val) = &patch.new_value {
                        if let Ok(val) = serde_json::from_str(new_val) {
                            if let Ok(idx) = part.parse::<usize>() {
                                if let Some(arr) = current.as_array_mut() {
                                    if idx < arr.len() {
                                        arr[idx] = val;
                                    } else {
                                        arr.push(val);
                                    }
                                }
                            } else if let Some(obj) = current.as_object_mut() {
                                obj.insert(part.to_string(), val);
                            }
                        }
                    }
                }
                "remove" => {
                    if let Ok(idx) = part.parse::<usize>() {
                        if let Some(arr) = current.as_array_mut() {
                            if idx < arr.len() {
                                arr.remove(idx);
                            }
                        }
                    } else if let Some(obj) = current.as_object_mut() {
                        obj.remove(*part);
                    }
                }
                _ => {}
            }
        } else {
            // Navigate deeper
            if let Ok(idx) = part.parse::<usize>() {
                if let Some(arr) = current.as_array_mut() {
                    if idx < arr.len() {
                        current = &mut arr[idx];
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            } else if let Some(obj) = current.as_object_mut() {
                if let Some(val) = obj.get_mut(*part) {
                    current = val;
                } else {
                    return;
                }
            } else {
                return;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_component_registry() {
        let mut registry = ComponentRegistry::new();
        registry.register("Button");
        registry.register("Card");

        assert!(registry.has("Button"));
        assert!(registry.has("Card"));
        assert!(!registry.has("Unknown"));
    }

    #[test]
    fn test_diff_simple() {
        let old = r#"{"text": "Hello"}"#;
        let new = r#"{"text": "World"}"#;

        let diffs = compute_diff(old, new, "");
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].path, "text");
        assert_eq!(diffs[0].change_type, "update");
    }

    #[test]
    fn test_diff_nested() {
        let old = r#"{"props": {"className": "old"}}"#;
        let new = r#"{"props": {"className": "new"}}"#;

        let diffs = compute_diff(old, new, "");
        assert_eq!(diffs.len(), 1);
        assert_eq!(diffs[0].path, "props.className");
    }
}
