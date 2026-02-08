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
import { type ReactNode, type FC } from 'react';
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
export declare const ESIMarkdown: FC<ESIMarkdownProps>;
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
export declare const ESILatex: FC<ESILatexProps>;
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
export declare const ESIJson: FC<ESIJsonProps>;
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
export declare const ESIPlaintext: FC<ESIPlaintextProps>;
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
export declare const ESICode: FC<ESICodeProps>;
export declare const ESIFormat: {
    Markdown: FC<ESIMarkdownProps>;
    Latex: FC<ESILatexProps>;
    Json: FC<ESIJsonProps>;
    Plaintext: FC<ESIPlaintextProps>;
    Code: FC<ESICodeProps>;
};
export default ESIFormat;
