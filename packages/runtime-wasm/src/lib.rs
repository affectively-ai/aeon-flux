//! Aeon Pages WASM Runtime
//!
//! Lightweight router and component hydration for @affectively/aeon-pages.
//! Compiles to ~20KB WASM for edge/browser deployment.

use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

mod router;
mod hydrate;
mod render;
mod skeleton;

pub use router::*;
pub use hydrate::*;
pub use render::*;
pub use skeleton::*;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Route definition from the build manifest
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RouteDefinition {
    /// Pattern like "/blog/[slug]" or "/api/[...path]"
    pattern: String,
    /// Session ID template, e.g., "blog-$slug"
    session_id: String,
    /// Component ID reference
    component_id: String,
    /// Optional layout wrapper
    layout: Option<String>,
    /// Whether this route uses 'use aeon' directive
    is_aeon: bool,
}

#[wasm_bindgen]
impl RouteDefinition {
    #[wasm_bindgen(constructor)]
    pub fn new(
        pattern: String,
        session_id: String,
        component_id: String,
        layout: Option<String>,
        is_aeon: bool,
    ) -> Self {
        Self {
            pattern,
            session_id,
            component_id,
            layout,
            is_aeon,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn pattern(&self) -> String {
        self.pattern.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn session_id(&self) -> String {
        self.session_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn component_id(&self) -> String {
        self.component_id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn layout(&self) -> Option<String> {
        self.layout.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn is_aeon(&self) -> bool {
        self.is_aeon
    }
}

/// Match result with extracted parameters
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RouteMatch {
    /// The matched route definition
    route: RouteDefinition,
    /// Extracted parameters from dynamic segments
    params: HashMap<String, String>,
    /// The resolved session ID with params substituted
    resolved_session_id: String,
}

#[wasm_bindgen]
impl RouteMatch {
    #[wasm_bindgen(getter)]
    pub fn route(&self) -> RouteDefinition {
        self.route.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn params_json(&self) -> String {
        serde_json::to_string(&self.params).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen(getter)]
    pub fn resolved_session_id(&self) -> String {
        self.resolved_session_id.clone()
    }

    pub fn get_param(&self, key: &str) -> Option<String> {
        self.params.get(key).cloned()
    }
}

/// Serialized component tree (stored in Aeon sessions)
#[wasm_bindgen]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializedComponent {
    /// Component type: "div", "Button", "MyComponent"
    #[serde(rename = "type")]
    component_type: String,
    /// Props as JSON
    props: Option<String>,
    /// Children: either strings or nested components
    children: Vec<SerializedChild>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SerializedChild {
    Text(String),
    Component(Box<SerializedComponent>),
}

#[wasm_bindgen]
impl SerializedComponent {
    #[wasm_bindgen(constructor)]
    pub fn new(component_type: String, props: Option<String>) -> Self {
        Self {
            component_type,
            props,
            children: Vec::new(),
        }
    }

    pub fn add_text_child(&mut self, text: String) {
        self.children.push(SerializedChild::Text(text));
    }

    pub fn add_component_child(&mut self, component: SerializedComponent) {
        self.children.push(SerializedChild::Component(Box::new(component)));
    }

    #[wasm_bindgen(getter)]
    pub fn component_type(&self) -> String {
        self.component_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn props(&self) -> Option<String> {
        self.props.clone()
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }

    pub fn from_json(json: &str) -> Result<SerializedComponent, JsValue> {
        serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse component: {}", e)))
    }
}

/// Log to browser console
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// Helper macro for console logging
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}
