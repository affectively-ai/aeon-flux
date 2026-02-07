/**
 * Edge Side Inference (ESI) Processor
 *
 * Like Varnish ESI but for AI - brings inference to the edge at render time.
 * Components can embed AI directly in templates for dynamic, personalized content.
 */
import type { ESIConfig, ESIDirective, ESIModel, ESIParams, ESIProcessor, ESIResult, UserContext } from './types';
export declare class EdgeWorkersESIProcessor implements ESIProcessor {
    name: string;
    private config;
    private warmupPromise?;
    constructor(config?: Partial<ESIConfig>);
    warmup(): Promise<void>;
    isModelAvailable(model: ESIModel): boolean;
    process(directive: ESIDirective, context: UserContext): Promise<ESIResult>;
    processBatch(directives: ESIDirective[], context: UserContext): Promise<ESIResult[]>;
    stream(directive: ESIDirective, context: UserContext, onChunk: (chunk: string) => void): Promise<ESIResult>;
    private callEdgeWorkers;
    private getEndpointForModel;
    private buildRequestBody;
    private parseResponse;
}
/**
 * Create an ESI directive for LLM inference
 */
export declare function esiInfer(prompt: string, options?: Partial<ESIParams>): ESIDirective;
/**
 * Create an ESI directive for embeddings
 */
export declare function esiEmbed(text: string): ESIDirective;
/**
 * Create an ESI directive for emotion detection
 */
export declare function esiEmotion(text: string, contextAware?: boolean): ESIDirective;
/**
 * Create an ESI directive for vision (image analysis)
 */
export declare function esiVision(base64Image: string, prompt: string, options?: Partial<ESIParams>): ESIDirective;
/**
 * Create a context-aware ESI directive
 * Automatically injects user context into the prompt
 */
export declare function esiWithContext(prompt: string, signals?: ESIDirective['signals'], options?: Partial<ESIParams>): ESIDirective;
export { ESIConfig, ESIDirective, ESIResult, ESIProcessor, ESIModel };
