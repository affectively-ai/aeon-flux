/**
 * Tree → TSX Compiler
 *
 * Converts component trees from the visual editor back to TSX source code.
 */
interface TreeNode {
    id: string;
    type: string;
    props?: Record<string, unknown>;
    children?: string[] | TreeNode[];
    text?: string;
}
interface CompilerOptions {
    /** Route path for the page */
    route: string;
    /** Include 'use aeon' directive */
    useAeon?: boolean;
    /** Component imports to add */
    imports?: Record<string, string>;
    /** Whether to format output */
    format?: boolean;
}
/**
 * Compile a tree to TSX source code
 */
export declare function compileTreeToTSX(tree: TreeNode | TreeNode[], options: CompilerOptions): string;
export {};
