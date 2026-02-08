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
  createElement,
  type ReactNode,
  type FC,
  type ReactElement,
  type ElementType,
} from 'react';

// ============================================================================
// Types
// ============================================================================

/** Supported wrapper element types */
type WrapperElement = 'div' | 'span' | 'pre' | 'code' | 'section' | 'article' | 'aside';

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

export interface ESICodeProps extends Omit<ESIFormatProps, 'as'> {
  /** Custom wrapper element */
  as?: WrapperElement;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Auto-detect language */
  autoDetect?: boolean;
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
  onOutput: (text: string) => void
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
        const text = typeof result === 'string'
          ? result
          : typeof result === 'object' && result !== null && 'output' in result
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
function parseMarkdown(text: string, options: {
  gfm?: boolean;
  allowHtml?: boolean;
  linkTarget?: string;
} = {}): string {
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
    `<a href="$2" target="${linkTarget}" rel="noopener noreferrer">$1</a>`
  );

  // Images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" />'
  );

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
      '<li><input type="checkbox" disabled /> $1</li>'
    );
    html = html.replace(
      /<li>\[x\]\s*(.+)<\/li>/gi,
      '<li><input type="checkbox" disabled checked /> $1</li>'
    );
  }

  // Tables (GFM) - simplified
  if (gfm) {
    const tableRegex = /^\|(.+)\|$/gm;
    const rows = html.match(tableRegex);
    if (rows && rows.length >= 2) {
      // Check for separator row
      const separatorIdx = rows.findIndex(row => /^\|[\s\-:|]+\|$/.test(row));
      if (separatorIdx === 1) {
        const headerRow = rows[0];
        const dataRows = rows.slice(2);

        const headerCells = headerRow.split('|').filter(c => c.trim());
        const headerHtml = `<thead><tr>${headerCells.map(c => `<th>${c.trim()}</th>`).join('')}</tr></thead>`;

        const bodyHtml = dataRows.map(row => {
          const cells = row.split('|').filter(c => c.trim());
          return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
        }).join('');

        const tableHtml = `<table>${headerHtml}<tbody>${bodyHtml}</tbody></table>`;

        // Replace the original table markdown
        const tableMarkdown = rows.slice(0, separatorIdx + 1 + dataRows.length).join('\n');
        html = html.replace(tableMarkdown, tableHtml);
      }
    }
  }

  // Paragraphs - wrap loose text
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

  // Clean up extra paragraph tags around block elements
  html = html.replace(/<p>(<(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|li|blockquote|pre|table|hr)>)<\/p>/g, '$1');

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
function parseLatex(text: string, options: {
  mode?: 'inline' | 'block' | 'auto';
  displayMode?: boolean;
} = {}): string {
  const { mode = 'auto', displayMode = false } = options;

  // Check if we should use display mode
  const isBlock = mode === 'block' ||
    (mode === 'auto' && (text.includes('\\[') || text.includes('$$')));

  // Convert common LaTeX to HTML entities/CSS
  let html = text;

  // Display math delimiters
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, '<div class="math-block">$1</div>');
  html = html.replace(/\\\[([\s\S]+?)\\\]/g, '<div class="math-block">$1</div>');

  // Inline math delimiters
  html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
  html = html.replace(/\\\((.+?)\\\)/g, '<span class="math-inline">$1</span>');

  // Common symbols
  const symbols: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
    '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
    '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
    '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Phi': 'Φ',
    '\\Psi': 'Ψ', '\\Omega': 'Ω',
    '\\infty': '∞', '\\pm': '±', '\\mp': '∓', '\\times': '×',
    '\\div': '÷', '\\cdot': '·', '\\leq': '≤', '\\geq': '≥',
    '\\neq': '≠', '\\approx': '≈', '\\equiv': '≡', '\\subset': '⊂',
    '\\supset': '⊃', '\\in': '∈', '\\notin': '∉', '\\cup': '∪',
    '\\cap': '∩', '\\emptyset': '∅', '\\forall': '∀', '\\exists': '∃',
    '\\nabla': '∇', '\\partial': '∂', '\\sum': '∑', '\\prod': '∏',
    '\\int': '∫', '\\oint': '∮', '\\sqrt': '√', '\\therefore': '∴',
    '\\because': '∵', '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐', '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔',
  };

  for (const [latex, symbol] of Object.entries(symbols)) {
    html = html.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), symbol);
  }

  // Fractions: \frac{a}{b}
  html = html.replace(
    /\\frac\{([^}]+)\}\{([^}]+)\}/g,
    '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>'
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
function formatJson(text: string, options: {
  indent?: number;
  syntaxHighlight?: boolean;
  theme?: 'light' | 'dark' | 'auto';
} = {}): string {
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
      '<span class="json-key">$1</span>:'
    );
    highlighted = highlighted.replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="json-string">$1</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
      ': <span class="json-number">$1</span>'
    );

    // Booleans and null
    highlighted = highlighted.replace(
      /:\s*(true|false|null)/g,
      ': <span class="json-$1">$1</span>'
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
function formatCode(text: string, options: {
  language?: string;
  lineNumbers?: boolean;
  startLine?: number;
  highlightLines?: number[];
} = {}): string {
  const { language, lineNumbers = false, startLine = 1, highlightLines = [] } = options;

  const lines = text.split('\n');
  const langClass = language ? ` language-${language}` : '';

  if (!lineNumbers) {
    return `<pre><code class="code-block${langClass}">${escapeHtml(text)}</code></pre>`;
  }

  const lineHtml = lines.map((line, i) => {
    const lineNum = startLine + i;
    const isHighlighted = highlightLines.includes(lineNum);
    const highlightClass = isHighlighted ? ' highlighted' : '';
    return `<span class="line${highlightClass}"><span class="line-number">${lineNum}</span><span class="line-content">${escapeHtml(line)}</span></span>`;
  }).join('\n');

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
    return (
      <Wrapper className={className}>
        {wrappedChildren}
      </Wrapper>
    );
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
    return (
      <Wrapper className={className}>
        {wrappedChildren}
      </Wrapper>
    );
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

  const style = useMemo(() => ({
    whiteSpace: preserveWhitespace ? 'pre-wrap' as const : 'normal' as const,
    wordWrap: wordWrap ? 'break-word' as const : 'normal' as const,
    maxWidth: maxWidth ? `${maxWidth}ch` : undefined,
    fontFamily: 'monospace',
  }), [preserveWhitespace, wordWrap, maxWidth]);

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
    return (
      <Wrapper className={className}>
        {wrappedChildren}
      </Wrapper>
    );
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
 * Render ESI output as code with optional syntax highlighting
 *
 * @example
 * ```tsx
 * <ESI.Code language="typescript" lineNumbers>
 *   <ESI.Infer>Write a TypeScript function to sort an array</ESI.Infer>
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
  lineNumbers = false,
  startLine = 1,
  highlightLines = [],
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

  // Extract code from markdown code blocks if present
  const extractCode = (text: string): { code: string; lang?: string } => {
    const match = text.match(/```(\w*)\n?([\s\S]*?)```/);
    if (match) {
      return { code: match[2].trim(), lang: match[1] || undefined };
    }
    return { code: text };
  };

  // Handle string children directly
  if (typeof children === 'string') {
    const { code, lang } = extractCode(children);
    const html = formatCode(code, {
      language: language || lang,
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
      </Wrapper>
    );
  }

  if (!output) {
    return <Wrapper className={className}>{fallback}</Wrapper>;
  }

  const { code, lang } = extractCode(output);
  const html = formatCode(code, {
    language: language || lang,
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
// ESI Format Namespace Export
// ============================================================================

export const ESIFormat = {
  Markdown: ESIMarkdown,
  Latex: ESILatex,
  Json: ESIJson,
  Plaintext: ESIPlaintext,
  Code: ESICode,
};

export default ESIFormat;
