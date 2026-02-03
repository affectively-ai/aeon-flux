//! Aeon Router - Fast path matching for Next.js-style routes
//!
//! Supports:
//! - Static routes: /about, /blog
//! - Dynamic segments: /blog/[slug]
//! - Catch-all segments: /api/[...path]
//! - Optional catch-all: /docs/[[...slug]]
//! - Route groups: (dashboard)/settings (ignored in URL)

use wasm_bindgen::prelude::*;
use std::collections::HashMap;
use crate::{RouteDefinition, RouteMatch};

/// Segment type for route pattern parsing
#[derive(Clone, Debug, PartialEq)]
enum Segment {
    /// Static segment like "blog" or "about"
    Static(String),
    /// Dynamic segment like [slug]
    Dynamic(String),
    /// Catch-all segment like [...path]
    CatchAll(String),
    /// Optional catch-all like [[...slug]]
    OptionalCatchAll(String),
}

/// Parsed route pattern
#[derive(Clone, Debug)]
struct ParsedRoute {
    segments: Vec<Segment>,
    definition: RouteDefinition,
}

/// The Aeon Router - matches URLs to routes
#[wasm_bindgen]
pub struct AeonRouter {
    routes: Vec<ParsedRoute>,
}

#[wasm_bindgen]
impl AeonRouter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { routes: Vec::new() }
    }

    /// Add a route to the router
    pub fn add_route(&mut self, definition: RouteDefinition) {
        let segments = parse_pattern(&definition.pattern());
        self.routes.push(ParsedRoute {
            segments,
            definition,
        });
        // Sort routes by specificity (static > dynamic > catch-all)
        self.routes.sort_by(|a, b| {
            route_specificity(&b.segments).cmp(&route_specificity(&a.segments))
        });
    }

    /// Match a URL path to a route
    pub fn match_route(&self, path: &str) -> Option<RouteMatch> {
        let path_segments: Vec<&str> = path
            .trim_start_matches('/')
            .trim_end_matches('/')
            .split('/')
            .filter(|s| !s.is_empty())
            .collect();

        for parsed in &self.routes {
            if let Some(params) = match_segments(&parsed.segments, &path_segments) {
                let resolved_session_id = resolve_session_id(
                    &parsed.definition.session_id(),
                    &params,
                );
                return Some(RouteMatch {
                    route: parsed.definition.clone(),
                    params,
                    resolved_session_id,
                });
            }
        }
        None
    }

    /// Get all registered routes (for debugging)
    pub fn get_routes_json(&self) -> String {
        let patterns: Vec<String> = self.routes
            .iter()
            .map(|r| r.definition.pattern())
            .collect();
        serde_json::to_string(&patterns).unwrap_or_else(|_| "[]".to_string())
    }

    /// Check if a route exists for the given path
    pub fn has_route(&self, path: &str) -> bool {
        self.match_route(path).is_some()
    }
}

impl Default for AeonRouter {
    fn default() -> Self {
        Self::new()
    }
}

/// Parse a route pattern into segments
fn parse_pattern(pattern: &str) -> Vec<Segment> {
    pattern
        .trim_start_matches('/')
        .trim_end_matches('/')
        .split('/')
        .filter(|s| !s.is_empty())
        .filter(|s| !is_route_group(s)) // Skip route groups like (dashboard)
        .map(|s| {
            if s.starts_with("[[...") && s.ends_with("]]") {
                // Optional catch-all: [[...slug]]
                let name = s[5..s.len() - 2].to_string();
                Segment::OptionalCatchAll(name)
            } else if s.starts_with("[...") && s.ends_with(']') {
                // Catch-all: [...path]
                let name = s[4..s.len() - 1].to_string();
                Segment::CatchAll(name)
            } else if s.starts_with('[') && s.ends_with(']') {
                // Dynamic: [slug]
                let name = s[1..s.len() - 1].to_string();
                Segment::Dynamic(name)
            } else {
                // Static
                Segment::Static(s.to_string())
            }
        })
        .collect()
}

/// Check if a segment is a route group (parentheses)
fn is_route_group(segment: &str) -> bool {
    segment.starts_with('(') && segment.ends_with(')')
}

/// Calculate route specificity for sorting (higher = more specific)
fn route_specificity(segments: &[Segment]) -> usize {
    let mut score = 0;
    for (i, segment) in segments.iter().enumerate() {
        let position_weight = 1000 - i; // Earlier segments are more important
        score += match segment {
            Segment::Static(_) => position_weight * 10,
            Segment::Dynamic(_) => position_weight * 5,
            Segment::CatchAll(_) => 1,
            Segment::OptionalCatchAll(_) => 0,
        };
    }
    score
}

/// Match path segments against route segments, returning extracted params
fn match_segments(
    route_segments: &[Segment],
    path_segments: &[&str],
) -> Option<HashMap<String, String>> {
    let mut params = HashMap::new();
    let mut path_idx = 0;

    for (_route_idx, segment) in route_segments.iter().enumerate() {
        match segment {
            Segment::Static(expected) => {
                if path_idx >= path_segments.len() {
                    return None;
                }
                if path_segments[path_idx] != expected {
                    return None;
                }
                path_idx += 1;
            }
            Segment::Dynamic(name) => {
                if path_idx >= path_segments.len() {
                    return None;
                }
                params.insert(name.clone(), path_segments[path_idx].to_string());
                path_idx += 1;
            }
            Segment::CatchAll(name) => {
                if path_idx >= path_segments.len() {
                    return None; // Catch-all must match at least one segment
                }
                let remaining: Vec<&str> = path_segments[path_idx..].to_vec();
                params.insert(name.clone(), remaining.join("/"));
                path_idx = path_segments.len();
            }
            Segment::OptionalCatchAll(name) => {
                // Optional catch-all can match zero or more segments
                if path_idx < path_segments.len() {
                    let remaining: Vec<&str> = path_segments[path_idx..].to_vec();
                    params.insert(name.clone(), remaining.join("/"));
                    path_idx = path_segments.len();
                }
                // If no more segments, that's fine - it's optional
            }
        }
    }

    // All path segments must be consumed (unless we had a catch-all)
    if path_idx == path_segments.len() {
        Some(params)
    } else {
        None
    }
}

/// Resolve session ID template with actual params
fn resolve_session_id(template: &str, params: &HashMap<String, String>) -> String {
    let mut result = template.to_string();
    for (key, value) in params {
        result = result.replace(&format!("${}", key), value);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_static_route() {
        let mut router = AeonRouter::new();
        router.add_route(RouteDefinition::new(
            "/about".to_string(),
            "about".to_string(),
            "AboutPage".to_string(),
            None,
            false,
        ));

        let result = router.match_route("/about");
        assert!(result.is_some());
        assert_eq!(result.unwrap().resolved_session_id(), "about");
    }

    #[test]
    fn test_dynamic_route() {
        let mut router = AeonRouter::new();
        router.add_route(RouteDefinition::new(
            "/blog/[slug]".to_string(),
            "blog-$slug".to_string(),
            "BlogPost".to_string(),
            None,
            true,
        ));

        let result = router.match_route("/blog/hello-world");
        assert!(result.is_some());
        let m = result.unwrap();
        assert_eq!(m.resolved_session_id(), "blog-hello-world");
        assert_eq!(m.get_param("slug"), Some("hello-world".to_string()));
    }

    #[test]
    fn test_catch_all_route() {
        let mut router = AeonRouter::new();
        router.add_route(RouteDefinition::new(
            "/api/[...path]".to_string(),
            "api-$path".to_string(),
            "ApiHandler".to_string(),
            None,
            false,
        ));

        let result = router.match_route("/api/users/123/posts");
        assert!(result.is_some());
        let m = result.unwrap();
        assert_eq!(m.get_param("path"), Some("users/123/posts".to_string()));
    }

    #[test]
    fn test_route_specificity() {
        let mut router = AeonRouter::new();

        // Add routes in random order
        router.add_route(RouteDefinition::new(
            "/blog/[slug]".to_string(),
            "blog-$slug".to_string(),
            "BlogPost".to_string(),
            None,
            true,
        ));
        router.add_route(RouteDefinition::new(
            "/blog/featured".to_string(),
            "blog-featured".to_string(),
            "FeaturedPost".to_string(),
            None,
            true,
        ));

        // Static route should match before dynamic
        let result = router.match_route("/blog/featured");
        assert!(result.is_some());
        assert_eq!(result.unwrap().resolved_session_id(), "blog-featured");
    }
}
