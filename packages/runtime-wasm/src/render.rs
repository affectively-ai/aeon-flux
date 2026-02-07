//! Zero-Dependency Page Rendering
//!
//! WASM-based renderer that walks component trees and produces
//! self-contained HTML with inline CSS, assets, and fonts.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// CSS Manifest for on-demand CSS generation
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CSSManifest {
    /// Version of the manifest
    version: String,
    /// Pre-computed CSS rules keyed by class name
    rules: HashMap<String, Vec<CSSRule>>,
    /// Critical CSS (always included)
    critical: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CSSRule {
    selector: String,
    declarations: String,
    media_query: Option<String>,
}

#[wasm_bindgen]
impl CSSManifest {
    #[wasm_bindgen(constructor)]
    pub fn new(critical: String) -> Self {
        Self {
            version: "1.0.0".to_string(),
            rules: HashMap::new(),
            critical,
        }
    }

    /// Load manifest from JSON
    pub fn from_json(json: &str) -> Result<CSSManifest, JsValue> {
        serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse CSS manifest: {}", e)))
    }

    /// Get critical CSS
    #[wasm_bindgen(getter)]
    pub fn critical(&self) -> String {
        self.critical.clone()
    }
}

/// Asset Manifest for inlining images/SVGs
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AssetManifest {
    /// Version of the manifest
    version: String,
    /// Asset entries keyed by original path
    assets: HashMap<String, AssetEntry>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AssetEntry {
    /// Original file path
    original_path: String,
    /// Base64 data URI
    data_uri: String,
    /// File size in bytes
    size: usize,
    /// File format (svg, png, jpg, etc.)
    format: String,
}

#[wasm_bindgen]
impl AssetManifest {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            version: "1.0.0".to_string(),
            assets: HashMap::new(),
        }
    }

    /// Load manifest from JSON
    pub fn from_json(json: &str) -> Result<AssetManifest, JsValue> {
        serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse asset manifest: {}", e)))
    }

    /// Get data URI for an asset path
    pub fn get_data_uri(&self, path: &str) -> Option<String> {
        self.assets.get(path).map(|e| e.data_uri.clone())
    }
}

impl Default for AssetManifest {
    fn default() -> Self {
        Self::new()
    }
}

/// Font Manifest for embedding fonts
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FontManifest {
    /// Version of the manifest
    version: String,
    /// Font entries keyed by family name
    fonts: HashMap<String, Vec<FontEntry>>,
    /// Pre-generated @font-face CSS
    font_face_css: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FontEntry {
    /// Font family name
    family: String,
    /// Font weight (400, 700, etc.)
    weight: u32,
    /// Font style (normal, italic)
    style: String,
    /// Base64 data URI
    data_uri: String,
    /// Font format (woff2, woff, etc.)
    format: String,
}

#[wasm_bindgen]
impl FontManifest {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            version: "1.0.0".to_string(),
            fonts: HashMap::new(),
            font_face_css: String::new(),
        }
    }

    /// Load manifest from JSON
    pub fn from_json(json: &str) -> Result<FontManifest, JsValue> {
        serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse font manifest: {}", e)))
    }

    /// Get @font-face CSS
    #[wasm_bindgen(getter)]
    pub fn font_face_css(&self) -> String {
        self.font_face_css.clone()
    }
}

impl Default for FontManifest {
    fn default() -> Self {
        Self::new()
    }
}

/// Render context containing manifests and collected data
#[wasm_bindgen]
pub struct RenderContext {
    css_manifest: CSSManifest,
    asset_manifest: AssetManifest,
    font_manifest: FontManifest,
    collected_classes: HashSet<String>,
    interactive_nodes: Vec<InteractiveNode>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct InteractiveNode {
    id: String,
    component_type: String,
    hydration_mode: String,
}

#[wasm_bindgen]
impl RenderContext {
    #[wasm_bindgen(constructor)]
    pub fn new(
        css_manifest_json: &str,
        asset_manifest_json: &str,
        font_manifest_json: &str,
    ) -> Result<RenderContext, JsValue> {
        let css_manifest = CSSManifest::from_json(css_manifest_json)?;
        let asset_manifest = AssetManifest::from_json(asset_manifest_json)?;
        let font_manifest = FontManifest::from_json(font_manifest_json)?;

        Ok(Self {
            css_manifest,
            asset_manifest,
            font_manifest,
            collected_classes: HashSet::new(),
            interactive_nodes: Vec::new(),
        })
    }

    /// Get collected CSS classes as JSON array
    pub fn get_collected_classes(&self) -> String {
        let classes: Vec<&String> = self.collected_classes.iter().collect();
        serde_json::to_string(&classes).unwrap_or_else(|_| "[]".to_string())
    }

    /// Get interactive nodes as JSON array
    pub fn get_interactive_nodes(&self) -> String {
        serde_json::to_string(&self.interactive_nodes).unwrap_or_else(|_| "[]".to_string())
    }
}

/// Component tree node for walking
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TreeNode {
    #[serde(rename = "type")]
    node_type: String,
    props: Option<HashMap<String, serde_json::Value>>,
    children: Option<Vec<TreeChild>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum TreeChild {
    Text(String),
    Node(Box<TreeNode>),
}

/// Walk the component tree and collect CSS classes
#[wasm_bindgen]
pub fn extract_css_classes(tree_json: &str) -> String {
    let tree: TreeNode = match serde_json::from_str(tree_json) {
        Ok(t) => t,
        Err(_) => return "[]".to_string(),
    };

    let mut classes = HashSet::new();
    walk_tree_for_classes(&tree, &mut classes);

    let class_vec: Vec<&String> = classes.iter().collect();
    serde_json::to_string(&class_vec).unwrap_or_else(|_| "[]".to_string())
}

fn walk_tree_for_classes(node: &TreeNode, classes: &mut HashSet<String>) {
    // Extract className/class from props
    if let Some(props) = &node.props {
        if let Some(class_val) = props.get("className").or_else(|| props.get("class")) {
            if let Some(class_str) = class_val.as_str() {
                for class in class_str.split_whitespace() {
                    if !class.is_empty() {
                        classes.insert(class.to_string());
                    }
                }
            }
        }
    }

    // Recurse into children
    if let Some(children) = &node.children {
        for child in children {
            if let TreeChild::Node(node) = child {
                walk_tree_for_classes(node, classes);
            }
        }
    }
}

/// Resolve asset references in the tree (replace paths with data URIs)
#[wasm_bindgen]
pub fn resolve_assets(tree_json: &str, manifest_json: &str) -> String {
    let mut tree: serde_json::Value = match serde_json::from_str(tree_json) {
        Ok(t) => t,
        Err(_) => return tree_json.to_string(),
    };

    let manifest: AssetManifest = match serde_json::from_str(manifest_json) {
        Ok(m) => m,
        Err(_) => return tree_json.to_string(),
    };

    resolve_assets_in_value(&mut tree, &manifest);
    serde_json::to_string(&tree).unwrap_or_else(|_| tree_json.to_string())
}

fn resolve_assets_in_value(value: &mut serde_json::Value, manifest: &AssetManifest) {
    match value {
        serde_json::Value::Object(map) => {
            // Check for src attribute with asset path
            if let Some(src) = map.get("src").and_then(|v| v.as_str()) {
                if src.starts_with('/') || src.starts_with("./") {
                    if let Some(data_uri) = manifest.get_data_uri(src) {
                        map.insert("src".to_string(), serde_json::Value::String(data_uri));
                    }
                }
            }

            // Recurse into all values
            for (_, v) in map.iter_mut() {
                resolve_assets_in_value(v, manifest);
            }
        }
        serde_json::Value::Array(arr) => {
            for item in arr.iter_mut() {
                resolve_assets_in_value(item, manifest);
            }
        }
        _ => {}
    }
}

/// HTML escape utility
fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#039;")
}

/// Convert camelCase to kebab-case for CSS properties
fn to_kebab_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() {
            if i > 0 {
                result.push('-');
            }
            result.push(c.to_ascii_lowercase());
        } else {
            result.push(c);
        }
    }
    result
}

/// Render a component tree to HTML string
#[wasm_bindgen]
pub fn render_tree_to_html(tree_json: &str) -> String {
    let tree: TreeNode = match serde_json::from_str(tree_json) {
        Ok(t) => t,
        Err(_) => return String::new(),
    };

    render_node(&tree)
}

fn render_node(node: &TreeNode) -> String {
    // Known HTML elements
    let html_tags: HashSet<&str> = [
        "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "a", "button", "img", "svg", "section", "header", "footer",
        "main", "nav", "aside", "article", "ul", "ol", "li",
        "form", "input", "textarea", "select", "option", "label",
        "table", "thead", "tbody", "tr", "th", "td",
        "video", "audio", "source", "canvas", "iframe",
        "strong", "em", "code", "pre", "blockquote", "hr", "br",
        "figure", "figcaption", "picture", "time", "mark",
    ].iter().cloned().collect();

    let void_elements: HashSet<&str> = [
        "img", "input", "br", "hr", "meta", "link", "source",
        "area", "base", "col", "embed", "param", "track", "wbr",
    ].iter().cloned().collect();

    let node_type = &node.node_type;
    let is_html = html_tags.contains(node_type.as_str());
    let is_void = void_elements.contains(node_type.as_str());

    // Build attributes
    let mut attrs = Vec::new();
    if let Some(props) = &node.props {
        for (key, value) in props {
            if key == "children" {
                continue;
            }

            match key.as_str() {
                "className" => {
                    if let Some(s) = value.as_str() {
                        attrs.push(format!("class=\"{}\"", escape_html(s)));
                    }
                }
                "htmlFor" => {
                    if let Some(s) = value.as_str() {
                        attrs.push(format!("for=\"{}\"", escape_html(s)));
                    }
                }
                "style" => {
                    if let Some(obj) = value.as_object() {
                        let style_parts: Vec<String> = obj.iter()
                            .filter_map(|(k, v)| {
                                v.as_str().map(|s| format!("{}: {}", to_kebab_case(k), s))
                            })
                            .collect();
                        if !style_parts.is_empty() {
                            attrs.push(format!("style=\"{}\"", escape_html(&style_parts.join("; "))));
                        }
                    }
                }
                _ if key.starts_with("data-") || key.starts_with("aria-") => {
                    if let Some(s) = value.as_str() {
                        attrs.push(format!("{}=\"{}\"", key, escape_html(s)));
                    } else if let Some(n) = value.as_f64() {
                        attrs.push(format!("{}=\"{}\"", key, n));
                    } else if let Some(b) = value.as_bool() {
                        if b {
                            attrs.push(key.clone());
                        }
                    }
                }
                _ => {
                    if let Some(s) = value.as_str() {
                        attrs.push(format!("{}=\"{}\"", key, escape_html(s)));
                    } else if let Some(n) = value.as_f64() {
                        attrs.push(format!("{}=\"{}\"", key, n));
                    } else if let Some(b) = value.as_bool() {
                        if b {
                            attrs.push(key.clone());
                        }
                    }
                }
            }
        }
    }

    let attr_str = if attrs.is_empty() {
        String::new()
    } else {
        format!(" {}", attrs.join(" "))
    };

    // Render children
    let children_html: String = if let Some(children) = &node.children {
        children.iter().map(|child| {
            match child {
                TreeChild::Text(text) => escape_html(text),
                TreeChild::Node(node) => render_node(node),
            }
        }).collect()
    } else {
        String::new()
    };

    if is_html {
        if is_void {
            format!("<{}{}>", node_type, attr_str)
        } else {
            format!("<{}{}>{}</{}>", node_type, attr_str, children_html, node_type)
        }
    } else {
        // Custom component - just render children
        children_html
    }
}

/// Generate CSS for collected classes
#[wasm_bindgen]
pub fn generate_css_for_classes(classes_json: &str, manifest_json: &str) -> String {
    let classes: Vec<String> = match serde_json::from_str(classes_json) {
        Ok(c) => c,
        Err(_) => return String::new(),
    };

    let manifest: CSSManifest = match serde_json::from_str(manifest_json) {
        Ok(m) => m,
        Err(_) => return String::new(),
    };

    let mut css = String::new();
    let mut media_rules: HashMap<String, Vec<String>> = HashMap::new();

    for class in &classes {
        if let Some(rules) = manifest.rules.get(class) {
            for rule in rules {
                let rule_css = format!("{} {{ {} }}\n", rule.selector, rule.declarations);
                if let Some(media) = &rule.media_query {
                    media_rules
                        .entry(media.clone())
                        .or_insert_with(Vec::new)
                        .push(rule_css);
                } else {
                    css.push_str(&rule_css);
                }
            }
        }
    }

    // Add media query grouped rules
    for (media, rules) in &media_rules {
        css.push_str(&format!("@media {} {{\n", media));
        for rule in rules {
            css.push_str(&format!("  {}", rule));
        }
        css.push_str("}\n");
    }

    css
}

/// Generate minimal hydration script for interactive components
#[wasm_bindgen]
pub fn generate_hydration_script(interactive_nodes_json: &str, env_json: &str) -> String {
    let nodes: Vec<InteractiveNode> = match serde_json::from_str(interactive_nodes_json) {
        Ok(n) => n,
        Err(_) => Vec::new(),
    };

    if nodes.is_empty() {
        return String::new();
    }

    let component_types: Vec<&str> = nodes.iter().map(|n| n.component_type.as_str()).collect();
    let components_json = serde_json::to_string(&component_types).unwrap_or_else(|_| "[]".to_string());

    // Build script without format! to avoid escaping issues
    let mut script = String::from("<script type=\"module\">\n");
    script.push_str("// Aeon Hydration - Lazy load interactive components\n");
    script.push_str("const h=async(e)=>{const c=e.dataset.aeonComponent;try{const m=await import('/_aeon/c/'+c+'.js');m.hydrate(e)}catch(err){console.error('[aeon] Failed to hydrate:',c,err)}};\n");
    script.push_str("const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);h(e.target)}})},{rootMargin:'100px'});\n");
    script.push_str("document.querySelectorAll('[data-aeon-interactive]').forEach(e=>io.observe(e));\n");
    script.push_str("window.__AEON__={env:");
    script.push_str(env_json);
    script.push_str(",components:");
    script.push_str(&components_json);
    script.push_str("};\n");
    script.push_str("</script>");
    script
}

/// Full page render: combines tree rendering with CSS, assets, and fonts
#[wasm_bindgen]
pub fn render_page(
    tree_json: &str,
    css_manifest_json: &str,
    asset_manifest_json: &str,
    font_manifest_json: &str,
    title: &str,
    description: &str,
) -> String {
    // 1. Extract CSS classes
    let classes_json = extract_css_classes(tree_json);

    // 2. Resolve assets
    let resolved_tree = resolve_assets(tree_json, asset_manifest_json);

    // 3. Render HTML
    let html_content = render_tree_to_html(&resolved_tree);

    // 4. Generate CSS
    let component_css = generate_css_for_classes(&classes_json, css_manifest_json);

    // 5. Get critical CSS and font CSS
    let css_manifest: CSSManifest = serde_json::from_str(css_manifest_json)
        .unwrap_or_else(|_| CSSManifest::new(String::new()));
    let font_manifest: FontManifest = serde_json::from_str(font_manifest_json)
        .unwrap_or_else(|_| FontManifest::new());

    let critical_css = css_manifest.critical();
    let font_css = font_manifest.font_face_css();

    // 6. Combine all CSS
    let full_css = format!("{}\n{}\n{}", critical_css, font_css, component_css);

    // 7. Build full HTML document
    let title_escaped = escape_html(title);
    let desc_meta = if description.is_empty() {
        String::new()
    } else {
        format!("\n  <meta name=\"description\" content=\"{}\">", escape_html(description))
    };

    format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{}</title>{}
  <style>{}</style>
</head>
<body>
  <div id="root">{}</div>
</body>
</html>"#, title_escaped, desc_meta, full_css, html_content)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_classes() {
        let tree = r#"{
            "type": "div",
            "props": {"className": "flex items-center p-4"},
            "children": []
        }"#;

        let result = extract_css_classes(tree);
        let classes: Vec<String> = serde_json::from_str(&result).unwrap();

        assert!(classes.contains(&"flex".to_string()));
        assert!(classes.contains(&"items-center".to_string()));
        assert!(classes.contains(&"p-4".to_string()));
    }

    #[test]
    fn test_render_simple() {
        let tree = r#"{
            "type": "div",
            "props": {"className": "container"},
            "children": [{"type": "Text", "props": {}, "children": []}]
        }"#;

        let html = render_tree_to_html(tree);
        assert!(html.contains("<div"));
        assert!(html.contains("class=\"container\""));
        assert!(html.contains("</div>"));
    }

    #[test]
    fn test_escape_html() {
        assert_eq!(escape_html("<script>"), "&lt;script&gt;");
        assert_eq!(escape_html("a & b"), "a &amp; b");
        assert_eq!(escape_html("\"test\""), "&quot;test&quot;");
    }

    #[test]
    fn test_to_kebab_case() {
        assert_eq!(to_kebab_case("backgroundColor"), "background-color");
        assert_eq!(to_kebab_case("fontSize"), "font-size");
        assert_eq!(to_kebab_case("color"), "color");
    }
}
