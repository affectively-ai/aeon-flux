//! Skeleton Rendering for Zero-CLS
//!
//! WASM-based skeleton renderer that produces HTML placeholders
//! matching the exact dimensions of final content.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Skeleton dimensions
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct SkeletonDimensions {
    pub width: Option<String>,
    pub height: Option<String>,
    #[serde(rename = "minHeight")]
    pub min_height: Option<String>,
    #[serde(rename = "aspectRatio")]
    pub aspect_ratio: Option<String>,
    pub padding: Option<String>,
    pub margin: Option<String>,
    #[serde(rename = "borderRadius")]
    pub border_radius: Option<String>,
    pub gap: Option<String>,
}

/// Skeleton metadata attached to nodes
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SkeletonMetadata {
    pub dimensions: SkeletonDimensions,
    pub shape: String,
    pub lines: Option<u32>,
    #[serde(rename = "isDynamic")]
    pub is_dynamic: bool,
    pub confidence: f32,
    pub source: String,
}

/// Component node with optional skeleton
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SkeletonNode {
    #[serde(rename = "type")]
    pub node_type: String,
    pub props: Option<HashMap<String, serde_json::Value>>,
    pub children: Option<Vec<SkeletonChild>>,
    #[serde(rename = "_skeleton")]
    pub skeleton: Option<SkeletonMetadata>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SkeletonChild {
    Text(String),
    Node(Box<SkeletonNode>),
}

/// Render a skeleton tree to HTML
#[wasm_bindgen]
pub fn render_skeleton(tree_json: &str) -> String {
    let tree: SkeletonNode = match serde_json::from_str(tree_json) {
        Ok(t) => t,
        Err(_) => return String::new(),
    };

    render_skeleton_node(&tree)
}

fn render_skeleton_node(node: &SkeletonNode) -> String {
    let skeleton = match &node.skeleton {
        Some(s) if s.is_dynamic => s,
        _ => {
            // Not dynamic or no skeleton - render children skeletons only
            return render_children_skeleton(&node.children);
        }
    };

    let style = build_skeleton_style(&skeleton.dimensions, &skeleton.shape);
    let class = format!("aeon-skeleton aeon-skeleton--{}", skeleton.shape);

    match skeleton.shape.as_str() {
        "text-block" => {
            let lines = skeleton.lines.unwrap_or(3);
            let mut html = format!(
                r#"<div class="{}" style="{}" aria-hidden="true">"#,
                class, style
            );
            for i in 0..lines {
                // Last line is shorter to look more natural
                let line_width = if i == lines - 1 { "60%" } else { "100%" };
                html.push_str(&format!(
                    r#"<div class="aeon-skeleton--line" style="width: {}; height: 1em; margin-bottom: 0.5em;"></div>"#,
                    line_width
                ));
            }
            html.push_str("</div>");
            html
        }
        "container" => {
            // For containers, render skeleton wrapper with child skeletons
            let children_html = render_children_skeleton(&node.children);
            format!(
                r#"<div class="{}" style="{}" aria-hidden="true">{}</div>"#,
                class, style, children_html
            )
        }
        _ => {
            // Simple shapes: rect, circle, text-line
            format!(
                r#"<div class="{}" style="{}" aria-hidden="true"></div>"#,
                class, style
            )
        }
    }
}

fn render_children_skeleton(children: &Option<Vec<SkeletonChild>>) -> String {
    match children {
        None => String::new(),
        Some(children) => children
            .iter()
            .filter_map(|child| match child {
                SkeletonChild::Text(_) => None, // Skip text in skeleton
                SkeletonChild::Node(n) => Some(render_skeleton_node(n)),
            })
            .collect(),
    }
}

fn build_skeleton_style(dims: &SkeletonDimensions, shape: &str) -> String {
    let mut styles = Vec::new();

    // Apply dimensions
    if let Some(w) = &dims.width {
        styles.push(format!("width: {}", w));
    }
    if let Some(h) = &dims.height {
        styles.push(format!("height: {}", h));
    }
    if let Some(mh) = &dims.min_height {
        styles.push(format!("min-height: {}", mh));
    }
    if let Some(ar) = &dims.aspect_ratio {
        styles.push(format!("aspect-ratio: {}", ar));
    }
    if let Some(p) = &dims.padding {
        styles.push(format!("padding: {}", p));
    }
    if let Some(m) = &dims.margin {
        styles.push(format!("margin: {}", m));
    }
    if let Some(gap) = &dims.gap {
        styles.push(format!("gap: {}", gap));
    }

    // Shape-specific border radius
    let radius = dims.border_radius.as_deref().unwrap_or(match shape {
        "circle" => "50%",
        "rect" => "0.25rem",
        "text-line" | "text-block" => "0.125rem",
        "container" => "0",
        _ => "0.25rem",
    });
    styles.push(format!("border-radius: {}", radius));

    // Container display
    if shape == "container" {
        styles.push("display: flex".to_string());
        styles.push("flex-direction: column".to_string());
    }

    styles.join("; ")
}

/// Generate skeleton CSS with pulse animation
#[wasm_bindgen]
pub fn generate_skeleton_css() -> String {
    r#"/* Aeon Skeleton Styles - Zero CLS */
.aeon-skeleton {
    background: linear-gradient(
        90deg,
        var(--aeon-skeleton-base, #e5e7eb) 0%,
        var(--aeon-skeleton-highlight, #f3f4f6) 50%,
        var(--aeon-skeleton-base, #e5e7eb) 100%
    );
    background-size: 200% 100%;
    animation: aeon-skeleton-pulse 1.5s ease-in-out infinite;
}

.aeon-skeleton--rect {
    display: block;
}

.aeon-skeleton--circle {
    display: block;
}

.aeon-skeleton--text-line {
    display: block;
    height: 1em;
}

.aeon-skeleton--text-block {
    display: flex;
    flex-direction: column;
}

.aeon-skeleton--line {
    background: inherit;
    background-size: inherit;
    animation: inherit;
    border-radius: 0.125rem;
}

.aeon-skeleton--container {
    background: transparent;
    animation: none;
}

@keyframes aeon-skeleton-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    :root {
        --aeon-skeleton-base: #374151;
        --aeon-skeleton-highlight: #4b5563;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .aeon-skeleton,
    .aeon-skeleton--line {
        animation: none;
        background-size: 100% 100%;
    }
}
"#
    .to_string()
}

/// Render a complete skeleton page (skeleton HTML + CSS)
#[wasm_bindgen]
pub fn render_skeleton_page(tree_json: &str) -> String {
    let skeleton_html = render_skeleton(tree_json);
    let skeleton_css = generate_skeleton_css();

    format!(
        r#"<style>{}</style>
<div id="aeon-skeleton" aria-hidden="true">{}</div>"#,
        skeleton_css, skeleton_html
    )
}

/// Get skeleton stats from a tree
#[wasm_bindgen]
pub fn get_skeleton_stats(tree_json: &str) -> String {
    let tree: SkeletonNode = match serde_json::from_str(tree_json) {
        Ok(t) => t,
        Err(_) => return r#"{"error": "Invalid tree JSON"}"#.to_string(),
    };

    let mut total_nodes = 0;
    let mut nodes_with_skeleton = 0;
    let mut confidence_sum = 0.0f32;
    let mut shapes: HashMap<String, u32> = HashMap::new();

    fn walk(
        node: &SkeletonNode,
        total: &mut u32,
        with_skeleton: &mut u32,
        confidence: &mut f32,
        shapes: &mut HashMap<String, u32>,
    ) {
        *total += 1;

        if let Some(skeleton) = &node.skeleton {
            if skeleton.is_dynamic {
                *with_skeleton += 1;
                *confidence += skeleton.confidence;
                *shapes.entry(skeleton.shape.clone()).or_insert(0) += 1;
            }
        }

        if let Some(children) = &node.children {
            for child in children {
                if let SkeletonChild::Node(n) = child {
                    walk(n, total, with_skeleton, confidence, shapes);
                }
            }
        }
    }

    walk(
        &tree,
        &mut total_nodes,
        &mut nodes_with_skeleton,
        &mut confidence_sum,
        &mut shapes,
    );

    let avg_confidence = if nodes_with_skeleton > 0 {
        confidence_sum / nodes_with_skeleton as f32
    } else {
        0.0
    };

    serde_json::json!({
        "totalNodes": total_nodes,
        "nodesWithSkeleton": nodes_with_skeleton,
        "averageConfidence": avg_confidence,
        "shapeDistribution": shapes
    })
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_simple_skeleton() {
        let tree = r#"{
            "type": "div",
            "props": {"className": "w-64 h-12"},
            "children": [],
            "_skeleton": {
                "dimensions": {"width": "16rem", "height": "3rem"},
                "shape": "rect",
                "isDynamic": true,
                "confidence": 0.8,
                "source": "tailwind"
            }
        }"#;

        let html = render_skeleton(tree);
        assert!(html.contains("aeon-skeleton"));
        assert!(html.contains("aeon-skeleton--rect"));
        assert!(html.contains("width: 16rem"));
        assert!(html.contains("height: 3rem"));
    }

    #[test]
    fn test_render_text_block() {
        let tree = r#"{
            "type": "p",
            "props": {},
            "children": [],
            "_skeleton": {
                "dimensions": {},
                "shape": "text-block",
                "lines": 3,
                "isDynamic": true,
                "confidence": 1.0,
                "source": "hint"
            }
        }"#;

        let html = render_skeleton(tree);
        assert!(html.contains("aeon-skeleton--text-block"));
        assert!(html.contains("aeon-skeleton--line"));
        // Should have 3 lines
        assert_eq!(html.matches("aeon-skeleton--line").count(), 3);
    }

    #[test]
    fn test_render_circle() {
        let tree = r#"{
            "type": "img",
            "props": {},
            "children": [],
            "_skeleton": {
                "dimensions": {"width": "3rem", "height": "3rem"},
                "shape": "circle",
                "isDynamic": true,
                "confidence": 1.0,
                "source": "hint"
            }
        }"#;

        let html = render_skeleton(tree);
        assert!(html.contains("aeon-skeleton--circle"));
        assert!(html.contains("border-radius: 50%"));
    }

    #[test]
    fn test_generate_css() {
        let css = generate_skeleton_css();
        assert!(css.contains(".aeon-skeleton"));
        assert!(css.contains("@keyframes aeon-skeleton-pulse"));
        assert!(css.contains("prefers-color-scheme: dark"));
        assert!(css.contains("prefers-reduced-motion"));
    }

    #[test]
    fn test_skeleton_stats() {
        let tree = r#"{
            "type": "div",
            "children": [
                {
                    "type": "img",
                    "_skeleton": {
                        "dimensions": {},
                        "shape": "circle",
                        "isDynamic": true,
                        "confidence": 0.9,
                        "source": "tailwind"
                    }
                },
                {
                    "type": "p",
                    "_skeleton": {
                        "dimensions": {},
                        "shape": "text-line",
                        "isDynamic": true,
                        "confidence": 0.7,
                        "source": "tailwind"
                    }
                }
            ]
        }"#;

        let stats = get_skeleton_stats(tree);
        let parsed: serde_json::Value = serde_json::from_str(&stats).unwrap();

        assert_eq!(parsed["totalNodes"], 3);
        assert_eq!(parsed["nodesWithSkeleton"], 2);
    }
}
