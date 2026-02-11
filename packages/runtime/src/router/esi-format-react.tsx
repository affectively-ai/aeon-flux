/**
 * ESI Format Components (React)
 *
 * Output transformation wrappers for ESI components.
 * These components wrap other ESI components and transform their output.
 *
 * @example
 * ```tsx
 * // Render inference output as markdown
 * <ESI.Markdown>
 *   <ESI.Infer>Generate documentation for this API endpoint</ESI.Infer>
 * </ESI.Markdown>
 *
 * // Render LaTeX math expressions
 * <ESI.Latex>
 *   <ESI.Infer>Write the quadratic formula</ESI.Infer>
 * </ESI.Latex>
 *
 * // Pretty-print JSON output
 * <ESI.Json>
 *   <ESI.Structured schema={mySchema}>Analyze this data</ESI.Structured>
 * </ESI.Json>
 * ```
 */

import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
  createElement,
  createContext,
  type ReactNode,
  type FC,
  type ReactElement,
  type ElementType,
} from 'react';

// Try to import useESI, but provide fallback if not in ESI context
let useESIContext:
  | (() => {
      process: (
        directive: unknown,
      ) => Promise<{ success: boolean; output?: string }>;
    })
  | null = null;
try {
  // Dynamic import to avoid circular dependency
  const esiReact = require('./esi-react');
  useESIContext = esiReact.useESI;
} catch {
  // ESI not available - code generation features won't work
}

// ============================================================================
// Types
// ============================================================================

/** Supported wrapper element types */
type WrapperElement =
  | 'div'
  | 'span'
  | 'pre'
  | 'code'
  | 'section'
  | 'article'
  | 'aside';

export interface ESIFormatProps {
  /** ESI component(s) to wrap */
  children: ReactNode;
  /** CSS class for the output container */
  className?: string;
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Fallback content if transformation fails */
  fallback?: ReactNode;
  /** Whether to sanitize output (default: true for HTML-producing formats) */
  sanitize?: boolean;
}

export interface ESIMarkdownProps extends ESIFormatProps {
  /** GitHub Flavored Markdown support */
  gfm?: boolean;
  /** Enable syntax highlighting for code blocks */
  syntaxHighlight?: boolean;
  /** Theme for syntax highlighting */
  syntaxTheme?: 'light' | 'dark' | 'auto';
  /** Allow raw HTML in markdown (default: false for security) */
  allowHtml?: boolean;
  /** Custom link target */
  linkTarget?: '_blank' | '_self' | '_parent' | '_top';
}

export interface ESILatexProps extends ESIFormatProps {
  /** Rendering mode */
  mode?: 'inline' | 'block' | 'auto';
  /** Display mode (larger, centered equations) */
  displayMode?: boolean;
  /** Error color for invalid LaTeX */
  errorColor?: string;
  /** Trust user input (allow dangerous commands) */
  trust?: boolean;
}

export interface ESIJsonProps extends Omit<ESIFormatProps, 'as'> {
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Indentation spaces */
  indent?: number;
  /** Syntax highlighting */
  syntaxHighlight?: boolean;
  /** Theme for syntax highlighting */
  theme?: 'light' | 'dark' | 'auto';
  /** Collapse objects/arrays by default */
  collapsed?: boolean;
  /** Max depth before collapsing */
  collapseDepth?: number;
  /** Enable copy button */
  copyable?: boolean;
}

export interface ESIPlaintextProps extends Omit<ESIFormatProps, 'as'> {
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Preserve whitespace */
  preserveWhitespace?: boolean;
  /** Word wrap */
  wordWrap?: boolean;
  /** Max width (characters) before wrapping */
  maxWidth?: number;
}

/** Supported code-specialized models */
export type CodeModel =
  | 'codestral' // Mistral Codestral
  | 'deepseek' // DeepSeek Coder
  | 'starcoder' // StarCoder
  | 'codellama' // Code Llama
  | 'qwen-coder' // Qwen Coder
  | 'claude' // Claude (general but excellent at code)
  | 'gpt-4' // GPT-4 (general but excellent at code)
  | 'llm'; // Default LLM

export interface ESICodeProps extends Omit<ESIFormatProps, 'as'> {
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Auto-detect language using AI inference */
  autoDetect?: boolean;
  /** Generate code from natural language description (text-to-code) */
  generateFrom?: string;
  /** Code model to use for generation/detection */
  model?: CodeModel;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Starting line number */
  startLine?: number;
  /** Highlight specific lines */
  highlightLines?: number[];
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Enable copy button */
  copyable?: boolean;
  /** Temperature for code generation (lower = more deterministic) */
  temperature?: number;
  /** Callback when language is detected */
  onLanguageDetect?: (language: string) => void;
  /** Callback when code is generated */
  onGenerate?: (code: string, language: string) => void;
}

// ============================================================================
// Utility: Extract text from children
// ============================================================================

/**
 * Intercept child component output and extract text content
 */
function useChildOutput(children: ReactNode): {
  output: string | null;
  isLoading: boolean;
  error: string | null;
} {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We need to render children and capture their output
  // This is done by providing a custom render prop
  useEffect(() => {
    // Simple case: children is just a string
    if (typeof children === 'string') {
      setOutput(children);
      setIsLoading(false);
      return;
    }

    // For React elements, we need to intercept the output
    // This will be handled by the wrapper logic below
  }, [children]);

  return { output, isLoading, error };
}

/** Props that ESI components typically have */
interface ESIComponentProps {
  render?: (result: unknown) => ReactNode;
  onComplete?: (result: unknown) => void;
  [key: string]: unknown;
}

/**
 * Wrap child ESI components to intercept their output
 */
function wrapChildren(
  children: ReactNode,
  onOutput: (text: string) => void,
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      // Plain text or null
      if (typeof child === 'string') {
        onOutput(child);
      }
      return null; // Don't render the raw child, we'll render transformed output
    }

    // Cast to our expected props shape
    const childProps = child.props as ESIComponentProps;
    const originalRender = childProps.render;
    const originalOnComplete = childProps.onComplete;

    // Clone with new props
    const newProps: ESIComponentProps = {
      ...childProps,
      render: (result: unknown) => {
        // Extract text from result
        const text =
          typeof result === 'string'
            ? result
            : typeof result === 'object' &&
                result !== null &&
                'output' in result
              ? String((result as { output: unknown }).output)
              : JSON.stringify(result);

        onOutput(text);

        // Still call original render if provided (for side effects)
        return originalRender ? originalRender(result) : null;
      },
      onComplete: (result: unknown) => {
        // Also capture from onComplete
        if (result && typeof result === 'object' && 'output' in result) {
          onOutput(String((result as { output: unknown }).output));
        }
        originalOnComplete?.(result);
      },
    };

    return cloneElement(child as ReactElement<ESIComponentProps>, newProps);
  });
}

// ============================================================================
// Simple Markdown Parser (no dependencies)
// ============================================================================

/**
 * Simple markdown to HTML converter
 * For production, consider using a library like marked or remark
 */
function parseMarkdown(
  text: string,
  options: {
    gfm?: boolean;
    allowHtml?: boolean;
    linkTarget?: string;
  } = {},
): string {
  const { gfm = true, allowHtml = false, linkTarget = '_blank' } = options;

  let html = text;

  // Escape HTML if not allowed
  if (!allowHtml) {
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Code blocks (fenced)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough (GFM)
  if (gfm) {
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  }

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="${linkTarget}" rel="noopener noreferrer">$1</a>`,
  );

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^(---|\*\*\*|___)$/gm, '<hr />');

  // Unordered lists
  html = html.replace(/^[\*\-\+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Task lists (GFM)
  if (gfm) {
    html = html.replace(
      /<li>\[ \]\s*(.+)<\/li>/g,
      '<li><input type="checkbox" disabled /> $1</li>',
    );
    html = html.replace(
      /<li>\[x\]\s*(.+)<\/li>/gi,
      '<li><input type="checkbox" disabled checked /> $1</li>',
    );
  }

  // Tables (GFM) - simplified
  if (gfm) {
    const tableRegex = /^\|(.+)\|$/gm;
    const rows = html.match(tableRegex);
    if (rows && rows.length >= 2) {
      // Check for separator row
      const separatorIdx = rows.findIndex((row) => /^\|[\s\-:|]+\|$/.test(row));
      if (separatorIdx === 1) {
        const headerRow = rows[0];
        const dataRows = rows.slice(2);

        const headerCells = headerRow.split('|').filter((c) => c.trim());
        const headerHtml = `<thead><tr>${headerCells.map((c) => `<th>${c.trim()}</th>`).join('')}</tr></thead>`;

        const bodyHtml = dataRows
          .map((row) => {
            const cells = row.split('|').filter((c) => c.trim());
            return `<tr>${cells.map((c) => `<td>${c.trim()}</td>`).join('')}</tr>`;
          })
          .join('');

        const tableHtml = `<table>${headerHtml}<tbody>${bodyHtml}</tbody></table>`;

        // Replace the original table markdown
        const tableMarkdown = rows
          .slice(0, separatorIdx + 1 + dataRows.length)
          .join('\n');
        html = html.replace(tableMarkdown, tableHtml);
      }
    }
  }

  // Paragraphs - wrap loose text
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

  // Clean up extra paragraph tags around block elements
  html = html.replace(
    /<p>(<(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)[^>]*>)/g,
    '$1',
  );
  html = html.replace(
    /(<\/(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)>)<\/p>/g,
    '$1',
  );

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br />');

  return html;
}

// ============================================================================
// Simple LaTeX to HTML (basic support)
// ============================================================================

/**
 * Simple LaTeX to HTML converter
 * For production, use KaTeX or MathJax
 */
function parseLatex(
  text: string,
  options: {
    mode?: 'inline' | 'block' | 'auto';
    displayMode?: boolean;
  } = {},
): string {
  const { mode = 'auto', displayMode = false } = options;

  // Check if we should use display mode
  const isBlock =
    mode === 'block' ||
    (mode === 'auto' && (text.includes('\\[') || text.includes('$$')));

  // Convert common LaTeX to HTML entities/CSS
  let html = text;

  // Display math delimiters
  html = html.replace(
    /\$\$([\s\S]+?)\$\$/g,
    '<div class="math-block">$1</div>',
  );
  html = html.replace(
    /\\\[([\s\S]+?)\\\]/g,
    '<div class="math-block">$1</div>',
  );

  // Inline math delimiters
  html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
  html = html.replace(/\\\((.+?)\\\)/g, '<span class="math-inline">$1</span>');

  // Common symbols
  const symbols: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\iota': 'ι',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    '\\Gamma': 'Γ',
    '\\Delta': 'Δ',
    '\\Theta': 'Θ',
    '\\Lambda': 'Λ',
    '\\Xi': 'Ξ',
    '\\Pi': 'Π',
    '\\Sigma': 'Σ',
    '\\Phi': 'Φ',
    '\\Psi': 'Ψ',
    '\\Omega': 'Ω',
    '\\infty': '∞',
    '\\pm': '±',
    '\\mp': '∓',
    '\\times': '×',
    '\\div': '÷',
    '\\cdot': '·',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\subset': '⊂',
    '\\supset': '⊃',
    '\\in': '∈',
    '\\notin': '∉',
    '\\cup': '∪',
    '\\cap': '∩',
    '\\emptyset': '∅',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\nabla': '∇',
    '\\partial': '∂',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\oint': '∮',
    '\\sqrt': '√',
    '\\therefore': '∴',
    '\\because': '∵',
    '\\angle': '∠',
    '\\perp': '⊥',
    '\\parallel': '∥',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
    '\\leftrightarrow': '↔',
    '\\Leftrightarrow': '⇔',
  };

  for (const [latex, symbol] of Object.entries(symbols)) {
    html = html.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), symbol);
  }

  // Fractions: \frac{a}{b}
  html = html.replace(
    /\\frac\{([^}]+)\}\{([^}]+)\}/g,
    '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>',
  );

  // Superscript: ^{x} or ^x
  html = html.replace(/\^{([^}]+)}/g, '<sup>$1</sup>');
  html = html.replace(/\^(\w)/g, '<sup>$1</sup>');

  // Subscript: _{x} or _x
  html = html.replace(/_{([^}]+)}/g, '<sub>$1</sub>');
  html = html.replace(/_(\w)/g, '<sub>$1</sub>');

  // Square root with argument
  html = html.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Bold/text commands
  html = html.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  html = html.replace(/\\text\{([^}]+)\}/g, '$1');

  // Remove remaining backslash commands we don't handle
  html = html.replace(/\\[a-zA-Z]+/g, '');

  // Wrap in display container if needed
  if (displayMode || isBlock) {
    html = `<div class="math-display">${html}</div>`;
  }

  return html;
}

// ============================================================================
// JSON Formatter
// ============================================================================

/**
 * Format and optionally highlight JSON
 */
function formatJson(
  text: string,
  options: {
    indent?: number;
    syntaxHighlight?: boolean;
    theme?: 'light' | 'dark' | 'auto';
  } = {},
): string {
  const { indent = 2, syntaxHighlight = true } = options;

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, indent);

    if (!syntaxHighlight) {
      return `<pre><code>${escapeHtml(formatted)}</code></pre>`;
    }

    // Simple syntax highlighting
    let highlighted = escapeHtml(formatted);

    // Strings (but not inside already highlighted)
    highlighted = highlighted.replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="json-key">$1</span>:',
    );
    highlighted = highlighted.replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="json-string">$1</span>',
    );

    // Numbers
    highlighted = highlighted.replace(
      /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      ': <span class="json-number">$1</span>',
    );

    // Booleans and null
    highlighted = highlighted.replace(
      /:\s*(true|false|null)/g,
      ': <span class="json-$1">$1</span>',
    );

    return `<pre class="json-highlight"><code>${highlighted}</code></pre>`;
  } catch {
    // Not valid JSON, return as-is
    return `<pre><code>${escapeHtml(text)}</code></pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================================
// Code Formatter
// ============================================================================

/**
 * Format code with optional syntax highlighting
 */
function formatCode(
  text: string,
  options: {
    language?: string;
    lineNumbers?: boolean;
    startLine?: number;
    highlightLines?: number[];
  } = {},
): string {
  const {
    language,
    lineNumbers = false,
    startLine = 1,
    highlightLines = [],
  } = options;

  const lines = text.split('\n');
  const langClass = language ? ` language-${language}` : '';

  if (!lineNumbers) {
    return `<pre><code class="code-block${langClass}">${escapeHtml(text)}</code></pre>`;
  }

  const lineHtml = lines
    .map((line, i) => {
      const lineNum = startLine + i;
      const isHighlighted = highlightLines.includes(lineNum);
      const highlightClass = isHighlighted ? ' highlighted' : '';
      return `<span class="line${highlightClass}"><span class="line-number">${lineNum}</span><span class="line-content">${escapeHtml(line)}</span></span>`;
    })
    .join('\n');

  return `<pre class="code-with-lines${langClass}"><code>${lineHtml}</code></pre>`;
}

// ============================================================================
// ESI.Markdown Component
// ============================================================================

/**
 * Render ESI output as markdown
 *
 * @example
 * ```tsx
 * <ESI.Markdown gfm>
 *   <ESI.Infer>Generate API documentation for the /users endpoint</ESI.Infer>
 * </ESI.Markdown>
 * ```
 */
export const ESIMarkdown: FC<ESIMarkdownProps> = ({
  children,
  className,
  as: Wrapper = 'div',
  fallback,
  gfm = true,
  syntaxHighlight = false,
  allowHtml = false,
  linkTarget = '_blank',
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle string children directly
  if (typeof children === 'string') {
    const html = parseMarkdown(children, { gfm, allowHtml, linkTarget });
    return (
      <Wrapper
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // For ESI components, wrap and intercept
  const wrappedChildren = useMemo(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);

  if (isLoading) {
    return (
      <Wrapper className={className}>
        {wrappedChildren}
        {/* Hidden wrapper to intercept output */}
      </Wrapper>
    );
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  const html = parseMarkdown(output, { gfm, allowHtml, linkTarget });

  return (
    <Wrapper
      className={`esi-markdown ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// ============================================================================
// ESI.Latex Component
// ============================================================================

/**
 * Render ESI output as LaTeX math
 *
 * @example
 * ```tsx
 * <ESI.Latex displayMode>
 *   <ESI.Infer>Write the quadratic formula in LaTeX</ESI.Infer>
 * </ESI.Latex>
 * ```
 */
export const ESILatex: FC<ESILatexProps> = ({
  children,
  className,
  as: Wrapper = 'div',
  fallback,
  mode = 'auto',
  displayMode = false,
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle string children directly
  if (typeof children === 'string') {
    const html = parseLatex(children, { mode, displayMode });
    return (
      <Wrapper
        className={`esi-latex ${className || ''}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  const wrappedChildren = useMemo(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);

  if (isLoading) {
    return <Wrapper className={className}>{wrappedChildren}</Wrapper>;
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  const html = parseLatex(output, { mode, displayMode });

  return (
    <Wrapper
      className={`esi-latex ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

// ============================================================================
// ESI.Json Component
// ============================================================================

/**
 * Render ESI output as formatted JSON
 *
 * @example
 * ```tsx
 * <ESI.Json indent={4} syntaxHighlight>
 *   <ESI.Structured schema={dataSchema}>Analyze this data</ESI.Structured>
 * </ESI.Json>
 * ```
 */
export const ESIJson: FC<ESIJsonProps> = ({
  children,
  className,
  as: Wrapper = 'div',
  fallback,
  indent = 2,
  syntaxHighlight = true,
  theme = 'auto',
  copyable = false,
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle string children directly
  if (typeof children === 'string') {
    const html = formatJson(children, { indent, syntaxHighlight, theme });
    return (
      <Wrapper className={`esi-json ${className || ''}`}>
        {copyable && (
          <button
            className="esi-json-copy"
            onClick={handleCopy}
            aria-label="Copy JSON"
          >
            {copied ? '✓' : '⎘'}
          </button>
        )}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Wrapper>
    );
  }

  const wrappedChildren = useMemo(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);

  if (isLoading) {
    return <Wrapper className={className}>{wrappedChildren}</Wrapper>;
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  const html = formatJson(output, { indent, syntaxHighlight, theme });

  return (
    <Wrapper className={`esi-json ${className || ''}`}>
      {copyable && (
        <button
          className="esi-json-copy"
          onClick={handleCopy}
          aria-label="Copy JSON"
        >
          {copied ? '✓' : '⎘'}
        </button>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Wrapper>
  );
};

// ============================================================================
// ESI.Plaintext Component
// ============================================================================

/**
 * Render ESI output as plain text (strips formatting)
 *
 * @example
 * ```tsx
 * <ESI.Plaintext preserveWhitespace>
 *   <ESI.Infer>Generate ASCII art</ESI.Infer>
 * </ESI.Plaintext>
 * ```
 */
export const ESIPlaintext: FC<ESIPlaintextProps> = ({
  children,
  className,
  as: Wrapper = 'div',
  fallback,
  preserveWhitespace = true,
  wordWrap = true,
  maxWidth,
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const style = useMemo(
    () => ({
      whiteSpace: preserveWhitespace
        ? ('pre-wrap' as const)
        : ('normal' as const),
      wordWrap: wordWrap ? ('break-word' as const) : ('normal' as const),
      maxWidth: maxWidth ? `${maxWidth}ch` : undefined,
      fontFamily: 'monospace',
    }),
    [preserveWhitespace, wordWrap, maxWidth],
  );

  // Handle string children directly
  if (typeof children === 'string') {
    return (
      <Wrapper className={`esi-plaintext ${className || ''}`} style={style}>
        {children}
      </Wrapper>
    );
  }

  const wrappedChildren = useMemo(() => {
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children]);

  if (isLoading) {
    return <Wrapper className={className}>{wrappedChildren}</Wrapper>;
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  return (
    <Wrapper className={`esi-plaintext ${className || ''}`} style={style}>
      {output}
    </Wrapper>
  );
};

// ============================================================================
// ESI.Code Component
// ============================================================================

/**
 * Render ESI output as code with optional syntax highlighting and AI generation
 *
 * @example
 * ```tsx
 * // Wrap inference output as code
 * <ESI.Code language="typescript" lineNumbers>
 *   <ESI.Infer>Write a TypeScript function to sort an array</ESI.Infer>
 * </ESI.Code>
 *
 * // Generate code from natural language (text-to-code)
 * <ESI.Code
 *   generateFrom="A React hook that fetches user data"
 *   language="typescript"
 *   model="codestral"
 * />
 *
 * // Auto-detect language
 * <ESI.Code autoDetect model="deepseek">
 *   {someCodeString}
 * </ESI.Code>
 * ```
 */
export const ESICode: FC<ESICodeProps> = ({
  children,
  className,
  as: Wrapper = 'div',
  fallback,
  language,
  autoDetect = false,
  generateFrom,
  model = 'codestral',
  lineNumbers = false,
  startLine = 1,
  highlightLines = [],
  copyable = false,
  temperature = 0.2,
  onLanguageDetect,
  onGenerate,
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string | undefined>(
    language,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  // Extract code from markdown code blocks if present
  const extractCode = useCallback(
    (text: string): { code: string; lang?: string } => {
      const match = text.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        return { code: match[2].trim(), lang: match[1] || undefined };
      }
      return { code: text };
    },
    [],
  );

  // Generate code from natural language using coding model
  useEffect(() => {
    if (!generateFrom || !useESIContext) return;

    setIsGenerating(true);
    setIsLoading(true);

    const generateCode = async () => {
      try {
        const esi = useESIContext!();
        const langHint = language ? ` in ${language}` : '';
        const prompt = `Generate clean, production-ready code${langHint} for the following requirement. Output ONLY the code, no explanations:\n\n${generateFrom}`;

        const result = await esi.process({
          id: `esi-code-gen-${Date.now()}`,
          params: {
            model: 'llm',
            variant: model,
            temperature,
            system: `You are an expert programmer. Generate clean, well-documented code. Output ONLY code wrapped in a markdown code block with the language specified. No explanations before or after.`,
          },
          content: {
            type: 'text',
            value: prompt,
          },
        });

        if (result.success && result.output) {
          const { code, lang } = extractCode(result.output);
          setOutput(code);
          const finalLang = language || lang;
          setDetectedLang(finalLang);
          onGenerate?.(code, finalLang || 'text');
        }
      } catch (err) {
        console.error('Code generation failed:', err);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };

    generateCode();
  }, [generateFrom, model, language, temperature, extractCode, onGenerate]);

  // Auto-detect language using AI
  useEffect(() => {
    if (!autoDetect || !output || detectedLang || !useESIContext) return;

    const detectLanguage = async () => {
      try {
        const esi = useESIContext!();
        const result = await esi.process({
          id: `esi-lang-detect-${Date.now()}`,
          params: {
            model: 'llm',
            variant: model,
            temperature: 0,
            maxTokens: 20,
            system:
              'You are a code language detector. Respond with ONLY the programming language name, nothing else.',
          },
          content: {
            type: 'text',
            value: `What programming language is this code written in?\n\n${output.slice(0, 500)}`,
          },
        });

        if (result.success && result.output) {
          const lang = result.output.trim().toLowerCase();
          setDetectedLang(lang);
          onLanguageDetect?.(lang);
        }
      } catch (err) {
        console.error('Language detection failed:', err);
      }
    };

    detectLanguage();
  }, [autoDetect, output, detectedLang, model, onLanguageDetect]);

  // Handle string children directly
  if (typeof children === 'string' && !generateFrom) {
    const { code, lang } = extractCode(children);
    const finalLang = language || lang || detectedLang;
    const html = formatCode(code, {
      language: finalLang,
      lineNumbers,
      startLine,
      highlightLines,
    });
    return (
      <Wrapper className={`esi-code ${className || ''}`}>
        {copyable && (
          <button
            className="esi-code-copy"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? '✓' : '⎘'}
          </button>
        )}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Wrapper>
    );
  }

  // If generating from prompt, show loading state
  if (generateFrom && isGenerating) {
    return (
      <Wrapper className={`esi-code esi-code-generating ${className || ''}`}>
        <div className="esi-code-loading">Generating code...</div>
      </Wrapper>
    );
  }

  const wrappedChildren = useMemo(() => {
    if (generateFrom) return null; // No children when generating
    return wrapChildren(children, (text) => {
      setOutput(text);
      setIsLoading(false);
    });
  }, [children, generateFrom]);

  if (isLoading && !generateFrom) {
    return <Wrapper className={className}>{wrappedChildren}</Wrapper>;
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  const { code, lang } = extractCode(output);
  const finalLang = language || lang || detectedLang;
  const html = formatCode(code, {
    language: finalLang,
    lineNumbers,
    startLine,
    highlightLines,
  });

  return (
    <Wrapper className={`esi-code ${className || ''}`}>
      {copyable && (
        <button
          className="esi-code-copy"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? '✓' : '⎘'}
        </button>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Wrapper>
  );
};

// ============================================================================
// ESI.Semantic Component - Embeddings to Structured HTML
// ============================================================================

/** Schema.org types for microdata */
export type SchemaOrgType =
  | 'Article'
  | 'BlogPosting'
  | 'CreativeWork'
  | 'Event'
  | 'HowTo'
  | 'NewsArticle'
  | 'Organization'
  | 'Person'
  | 'Place'
  | 'Product'
  | 'Recipe'
  | 'Review'
  | 'Thing'
  | 'WebPage';

/** Extracted semantic topic */
export interface SemanticTopic {
  /** Topic label */
  label: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Schema.org type */
  schemaType?: SchemaOrgType;
  /** Related keywords */
  keywords?: string[];
  /** Embedding vector (if requested) */
  embedding?: number[];
}

/** Extracted entity */
export interface SemanticEntity {
  /** Entity text */
  text: string;
  /** Entity type (person, place, org, etc.) */
  type:
    | 'person'
    | 'place'
    | 'organization'
    | 'date'
    | 'money'
    | 'product'
    | 'event'
    | 'other';
  /** Schema.org type */
  schemaType?: SchemaOrgType;
  /** Start position in text */
  start?: number;
  /** End position in text */
  end?: number;
}

/** Extracted emotion from text */
export interface SemanticEmotion {
  /** Primary emotion */
  primary: string;
  /** Valence: negative (-1) to positive (1) */
  valence: number;
  /** Arousal: calm (0) to excited (1) */
  arousal: number;
  /** Confidence 0-1 */
  confidence: number;
}

export interface ESISemanticProps extends Omit<ESIFormatProps, 'as'> {
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Text to analyze (or children) */
  text?: string;
  /** Output format */
  format?: 'microdata' | 'jsonld' | 'rdfa' | 'tags';
  /** Include embeddings in output */
  includeEmbeddings?: boolean;
  /** Maximum topics to extract */
  maxTopics?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Schema.org type hint */
  schemaType?: SchemaOrgType;
  /** Extract named entities using entity model */
  extractEntities?: boolean;
  /** Extract emotion using emotion model */
  extractEmotion?: boolean;
  /** Custom topic vocabulary (for domain-specific topics) */
  vocabulary?: string[];
  /** Callback with extracted data */
  onExtract?: (data: {
    topics: SemanticTopic[];
    entities: SemanticEntity[];
    emotion?: SemanticEmotion;
  }) => void;
}

/**
 * Extract semantic topics and generate structured HTML with microdata
 *
 * @example
 * ```tsx
 * // Extract topics as microdata
 * <ESI.Semantic format="microdata" maxTopics={5}>
 *   <ESI.Infer>Summarize this article about climate change</ESI.Infer>
 * </ESI.Semantic>
 *
 * // Generate JSON-LD structured data
 * <ESI.Semantic format="jsonld" schemaType="Article">
 *   {articleText}
 * </ESI.Semantic>
 *
 * // Extract as tags for display
 * <ESI.Semantic format="tags" extractEntities>
 *   {content}
 * </ESI.Semantic>
 * ```
 */
export const ESISemantic: FC<ESISemanticProps> = ({
  children,
  text,
  className,
  as: Wrapper = 'div',
  fallback,
  format = 'microdata',
  includeEmbeddings = false,
  maxTopics = 5,
  minConfidence = 0.5,
  schemaType = 'Thing',
  extractEntities = false,
  extractEmotion = false,
  vocabulary,
  onExtract,
}) => {
  const [output, setOutput] = useState<string | null>(null);
  const [topics, setTopics] = useState<SemanticTopic[]>([]);
  const [entities, setEntities] = useState<SemanticEntity[]>([]);
  const [emotion, setEmotion] = useState<SemanticEmotion | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [structuredHtml, setStructuredHtml] = useState<string>('');

  const inputText = text || (typeof children === 'string' ? children : null);

  // Extract semantics using ESI
  useEffect(() => {
    if (!inputText && !output) return;
    if (!useESIContext) {
      setIsLoading(false);
      return;
    }

    const extractSemantics = async () => {
      try {
        const esi = useESIContext!();
        const textToAnalyze = inputText || output || '';

        // Build prompt for semantic extraction
        const vocabHint = vocabulary?.length
          ? `Focus on these topics: ${vocabulary.join(', ')}`
          : '';

        const entityHint = extractEntities
          ? 'Also extract named entities (people, places, organizations, dates).'
          : '';

        const prompt = `Analyze this text and extract semantic topics and metadata.
${vocabHint}
${entityHint}

Return JSON in this exact format:
{
  "topics": [
    { "label": "topic name", "confidence": 0.95, "keywords": ["kw1", "kw2"], "schemaType": "Article" }
  ],
  "entities": [
    { "text": "entity text", "type": "person|place|organization|date|money|product|event|other" }
  ],
  "suggestedSchema": "Article|BlogPosting|etc"
}

Text to analyze:
${textToAnalyze.slice(0, 2000)}`;

        const result = await esi.process({
          id: `esi-semantic-${Date.now()}`,
          params: {
            model: 'llm',
            temperature: 0.1,
            maxTokens: 1000,
            system:
              'You are a semantic analysis expert. Extract topics, entities, and suggest Schema.org types. Always respond with valid JSON.',
          },
          content: {
            type: 'text',
            value: prompt,
          },
        });

        if (result.success && result.output) {
          try {
            // Parse the JSON response
            const jsonMatch = result.output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const extractedTopics: SemanticTopic[] = (parsed.topics || [])
                .filter((t: SemanticTopic) => t.confidence >= minConfidence)
                .slice(0, maxTopics);
              const extractedEntities: SemanticEntity[] = parsed.entities || [];

              setTopics(extractedTopics);

              // Use dedicated entity extraction model if available
              if (extractEntities) {
                try {
                  const entityResult = await esi.process({
                    id: `esi-semantic-entities-${Date.now()}`,
                    params: { model: 'classify' }, // Entity extraction model
                    content: {
                      type: 'text',
                      value: textToAnalyze.slice(0, 2000),
                    },
                  });
                  if (entityResult.success && entityResult.output) {
                    try {
                      const entityParsed = JSON.parse(entityResult.output);
                      if (Array.isArray(entityParsed)) {
                        extractedEntities.push(...entityParsed);
                      }
                    } catch {
                      // Use LLM-extracted entities as fallback
                    }
                  }
                } catch {
                  // Entity model not available, use LLM-extracted entities
                }
              }
              setEntities(extractedEntities);

              // Use dedicated emotion model if requested
              let extractedEmotion: SemanticEmotion | undefined;
              if (extractEmotion) {
                try {
                  const emotionResult = await esi.process({
                    id: `esi-semantic-emotion-${Date.now()}`,
                    params: { model: 'emotion' }, // Emotion detection model
                    content: {
                      type: 'text',
                      value: textToAnalyze.slice(0, 1000),
                    },
                  });
                  if (emotionResult.success && emotionResult.output) {
                    try {
                      extractedEmotion = JSON.parse(emotionResult.output);
                      setEmotion(extractedEmotion);
                    } catch {
                      // Parse emotion from string format
                      const match = emotionResult.output.match(/(\w+)/);
                      if (match) {
                        extractedEmotion = {
                          primary: match[1],
                          valence: 0,
                          arousal: 0.5,
                          confidence: 0.8,
                        };
                        setEmotion(extractedEmotion);
                      }
                    }
                  }
                } catch {
                  // Emotion model not available
                }
              }

              onExtract?.({
                topics: extractedTopics,
                entities: extractedEntities,
                emotion: extractedEmotion,
              });

              // Generate structured HTML
              const html = generateStructuredHtml(
                textToAnalyze,
                extractedTopics,
                extractedEntities,
                format,
                parsed.suggestedSchema || schemaType,
                extractedEmotion,
              );
              setStructuredHtml(html);
            }
          } catch (parseErr) {
            console.error('Failed to parse semantic extraction:', parseErr);
          }
        }

        // Get embeddings if requested
        if (includeEmbeddings) {
          const embedResult = await esi.process({
            id: `esi-semantic-embed-${Date.now()}`,
            params: { model: 'embed' },
            content: { type: 'text', value: textToAnalyze.slice(0, 1000) },
          });

          const embeddingResult = embedResult as {
            success: boolean;
            embedding?: number[];
          };
          if (embeddingResult.success && embeddingResult.embedding) {
            const embedding = embeddingResult.embedding;
            setTopics((prev) =>
              prev.map((t, i) => (i === 0 ? { ...t, embedding } : t)),
            );
          }
        }
      } catch (err) {
        console.error('Semantic extraction failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    extractSemantics();
  }, [
    inputText,
    output,
    maxTopics,
    minConfidence,
    schemaType,
    extractEntities,
    vocabulary,
    format,
    includeEmbeddings,
    onExtract,
  ]);

  // Handle ESI children
  const wrappedChildren = useMemo(() => {
    if (inputText) return null;
    return wrapChildren(children, (text) => {
      setOutput(text);
    });
  }, [children, inputText]);

  if (isLoading) {
    return (
      <Wrapper
        className={`esi-semantic esi-semantic-loading ${className || ''}`}
      >
        {wrappedChildren}
        {!wrappedChildren && <span>Analyzing...</span>}
      </Wrapper>
    );
  }

  if (!structuredHtml && !topics.length) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  // For 'tags' format, render as interactive tag list
  if (format === 'tags') {
    return (
      <Wrapper className={`esi-semantic esi-semantic-tags ${className || ''}`}>
        {emotion && (
          <div
            className={`esi-semantic-emotion esi-semantic-emotion-${emotion.primary}`}
            data-valence={emotion.valence}
            data-arousal={emotion.arousal}
          >
            <span className="esi-semantic-emotion-label">
              {emotion.primary}
            </span>
            <span className="esi-semantic-emotion-confidence">
              {(emotion.confidence * 100).toFixed(0)}%
            </span>
          </div>
        )}
        <div className="esi-semantic-topics">
          {topics.map((topic, i) => (
            <span
              key={i}
              className="esi-semantic-tag"
              data-confidence={topic.confidence.toFixed(2)}
              data-schema={topic.schemaType}
            >
              {topic.label}
            </span>
          ))}
        </div>
        {entities.length > 0 && (
          <div className="esi-semantic-entities">
            {entities.map((entity, i) => (
              <span
                key={i}
                className={`esi-semantic-entity esi-semantic-entity-${entity.type}`}
                data-type={entity.type}
              >
                {entity.text}
              </span>
            ))}
          </div>
        )}
      </Wrapper>
    );
  }

  // For structured formats, render the HTML
  return (
    <Wrapper
      className={`esi-semantic ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: structuredHtml }}
    />
  );
};

/**
 * Generate structured HTML with microdata, JSON-LD, or RDFa
 */
function generateStructuredHtml(
  text: string,
  topics: SemanticTopic[],
  entities: SemanticEntity[],
  format: 'microdata' | 'jsonld' | 'rdfa' | 'tags',
  schemaType: SchemaOrgType,
  emotion?: SemanticEmotion,
): string {
  const keywords = topics.flatMap((t) => t.keywords || [t.label]).join(', ');

  switch (format) {
    case 'jsonld': {
      const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        name: topics[0]?.label || 'Content',
        keywords,
        about: topics.map((t) => ({
          '@type': t.schemaType || 'Thing',
          name: t.label,
        })),
        mentions: entities.map((e) => ({
          '@type': e.schemaType || entityTypeToSchema(e.type),
          name: e.text,
        })),
      };
      // Add emotion as custom property (using schema.org extension pattern)
      if (emotion) {
        jsonLd['emotionalTone'] = {
          '@type': 'PropertyValue',
          name: 'emotionalTone',
          value: emotion.primary,
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'valence',
              value: emotion.valence,
            },
            {
              '@type': 'PropertyValue',
              name: 'arousal',
              value: emotion.arousal,
            },
            {
              '@type': 'PropertyValue',
              name: 'confidence',
              value: emotion.confidence,
            },
          ],
        };
      }
      return `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>
<div class="esi-semantic-content">${escapeHtml(text)}</div>`;
    }

    case 'rdfa': {
      const topicSpans = topics
        .map(
          (t) =>
            `<span property="about" typeof="${t.schemaType || 'Thing'}"><span property="name">${escapeHtml(t.label)}</span></span>`,
        )
        .join(' ');
      const emotionSpan = emotion
        ? `<span property="emotionalTone" content="${escapeHtml(emotion.primary)}" data-valence="${emotion.valence}" data-arousal="${emotion.arousal}"></span>`
        : '';
      return `<div vocab="https://schema.org/" typeof="${schemaType}">
  <meta property="keywords" content="${escapeHtml(keywords)}" />
  ${emotionSpan}
  <div property="articleBody">${escapeHtml(text)}</div>
  <div class="esi-semantic-about">${topicSpans}</div>
</div>`;
    }

    case 'microdata':
    default: {
      const topicSpans = topics
        .map(
          (t) =>
            `<span itemprop="about" itemscope itemtype="https://schema.org/${t.schemaType || 'Thing'}">
          <span itemprop="name">${escapeHtml(t.label)}</span>
        </span>`,
        )
        .join('\n');
      const entitySpans = entities
        .map(
          (e) =>
            `<span itemprop="mentions" itemscope itemtype="https://schema.org/${entityTypeToSchema(e.type)}">
          <span itemprop="name">${escapeHtml(e.text)}</span>
        </span>`,
        )
        .join('\n');
      const emotionMeta = emotion
        ? `<meta itemprop="emotionalTone" content="${escapeHtml(emotion.primary)}" data-valence="${emotion.valence}" data-arousal="${emotion.arousal}" data-confidence="${emotion.confidence}" />`
        : '';
      return `<div itemscope itemtype="https://schema.org/${schemaType}">
  <meta itemprop="keywords" content="${escapeHtml(keywords)}" />
  ${emotionMeta}
  <div itemprop="articleBody">${escapeHtml(text)}</div>
  <div class="esi-semantic-about">${topicSpans}</div>
  <div class="esi-semantic-mentions">${entitySpans}</div>
</div>`;
    }
  }
}

/**
 * Map entity type to Schema.org type
 */
function entityTypeToSchema(type: SemanticEntity['type']): SchemaOrgType {
  const map: Record<SemanticEntity['type'], SchemaOrgType> = {
    person: 'Person',
    place: 'Place',
    organization: 'Organization',
    date: 'Thing',
    money: 'Thing',
    product: 'Product',
    event: 'Event',
    other: 'Thing',
  };
  return map[type] || 'Thing';
}

// ============================================================================
// ESI Format Namespace Export
// ============================================================================

export const ESIFormat = {
  Markdown: ESIMarkdown,
  Latex: ESILatex,
  Json: ESIJson,
  Plaintext: ESIPlaintext,
  Code: ESICode,
  Semantic: ESISemantic,
};

export default ESIFormat;
