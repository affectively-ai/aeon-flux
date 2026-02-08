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
/** Supported code-specialized models */
export type CodeModel = 'codestral' | 'deepseek' | 'starcoder' | 'codellama' | 'qwen-coder' | 'claude' | 'gpt-4' | 'llm';
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
export declare const ESICode: FC<ESICodeProps>;
/** Schema.org types for microdata */
export type SchemaOrgType = 'Article' | 'BlogPosting' | 'CreativeWork' | 'Event' | 'HowTo' | 'NewsArticle' | 'Organization' | 'Person' | 'Place' | 'Product' | 'Recipe' | 'Review' | 'Thing' | 'WebPage';
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
    type: 'person' | 'place' | 'organization' | 'date' | 'money' | 'product' | 'event' | 'other';
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
export declare const ESISemantic: FC<ESISemanticProps>;
export declare const ESIFormat: {
    Markdown: FC<ESIMarkdownProps>;
    Latex: FC<ESILatexProps>;
    Json: FC<ESIJsonProps>;
    Plaintext: FC<ESIPlaintextProps>;
    Code: FC<ESICodeProps>;
    Semantic: FC<ESISemanticProps>;
};
export default ESIFormat;
