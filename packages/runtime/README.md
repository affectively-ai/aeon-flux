# @affectively/aeon-pages-runtime

Edge-first rendering runtime for Aeon-Flux with Edge Side Inference (ESI), hyperpersonalized routing, and real-time collaboration.

## Installation

```bash
bun add @affectively/aeon-pages-runtime
```

## Features

### Edge Side Inference (ESI)

AI-powered personalization at render time. Components that adapt to user context before reaching the browser.

```tsx
import { ESI, ESIProvider } from '@affectively/aeon-pages-runtime/router';

function App() {
  return (
    <ESIProvider>
      {/* AI-generated personalized greeting */}
      <ESI.Infer prompt="Greet the user based on time of day">
        {(greeting) => <h1>{greeting}</h1>}
      </ESI.Infer>

      {/* Tier-gated content */}
      <ESI.TierGate tier="premium">
        <PremiumFeatures />
      </ESI.TierGate>

      {/* Emotion-aware content */}
      <ESI.EmotionGate emotions={['calm', 'content']}>
        <RelaxingContent />
      </ESI.EmotionGate>
    </ESIProvider>
  );
}
```

### AI Translation

Automatic translation at the edge. Supports 33 languages with LLM-based translation.

```tsx
import { ESI, TranslationProvider } from '@affectively/aeon-pages-runtime/router';

// App-wide translation with user's preferred language
function App() {
  return (
    <TranslationProvider defaultLanguage="es">
      <ESI.Translate>Welcome to our platform</ESI.Translate>
      {/* Renders: "Bienvenido a nuestra plataforma" */}
    </TranslationProvider>
  );
}

// Explicit target language
<ESI.Translate targetLanguage="ja">Hello world</ESI.Translate>
// Renders: "こんにちは世界"

// With context for better translation quality
<ESI.Translate
  targetLanguage="fr"
  context="emotional wellness app"
>
  We're here to help you understand your feelings.
</ESI.Translate>
```

#### Data-Attribute Translation

Automatically translate any element with `data-translate`:

```html
<p data-translate data-target-lang="es">Hello world</p>
<!-- Becomes: "Hola mundo" -->

<span data-translate data-translate-context="formal, business">
  Please review the attached document.
</span>
```

```tsx
import { useTranslationObserver } from '@affectively/aeon-pages-runtime/router';

function App() {
  // Automatically translates all data-translate elements
  useTranslationObserver({ defaultTargetLanguage: 'es' });

  return <div data-translate>Hello</div>;
}
```

#### Language Configuration Priority

1. `ESI.Translate` `targetLanguage` prop
2. `TranslationProvider` context
3. `window.__AEON_ESI_STATE__.preferences.language`
4. `<meta name="aeon-language" content="es">`
5. User preferences
6. Browser `navigator.language`

#### Supported Languages

`en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `pl`, `ru`, `zh`, `ja`, `ko`, `ar`, `hi`, `bn`, `vi`, `th`, `tr`, `id`, `ms`, `tl`, `sv`, `da`, `no`, `fi`, `cs`, `el`, `he`, `uk`, `ro`, `hu`, `ca`, `hy`

### Hyperpersonalized Routing

Routes adapt to user context: time, location, emotion state, and tier.

```tsx
import { HeuristicAdapter } from '@affectively/aeon-pages-runtime/router';

const adapter = new HeuristicAdapter({
  tierFeatures: {
    free: { maxAIInferences: 5 },
    premium: { maxAIInferences: 100 },
  },
});

// Route decision based on user context
const decision = await adapter.decide(userContext, '/dashboard');
// Returns: layout, theme, skeleton hints, prefetch suggestions
```

### Speculative Pre-rendering

Pages render before you click. Zero perceived latency.

```tsx
import { SpeculationManager, autoInitSpeculation } from '@affectively/aeon-pages-runtime/router';

// Auto-initialize based on browser support
autoInitSpeculation();

// Or manual control
const speculation = new SpeculationManager({
  prefetchUrls: ['/dashboard', '/settings'],
  prerenderUrls: ['/about'],
});
speculation.start();
```

### ESI Control Components

Declarative control flow with AI-powered conditions.

```tsx
import { ESI } from '@affectively/aeon-pages-runtime/router';

// Conditional rendering
<ESI.If condition="user.tier === 'premium'">
  <PremiumBadge />
</ESI.If>

// Pattern matching
<ESI.Match value={userEmotion}>
  <ESI.Case when="happy"><HappyContent /></ESI.Case>
  <ESI.Case when="sad"><SupportContent /></ESI.Case>
  <ESI.Default><NeutralContent /></ESI.Default>
</ESI.Match>

// Time-based gates
<ESI.TimeGate hours={{ start: 9, end: 17 }}>
  <BusinessHoursContent />
</ESI.TimeGate>

// A/B Testing
<ESI.ABTest variants={['control', 'variant-a', 'variant-b']}>
  {(variant) => <Component variant={variant} />}
</ESI.ABTest>
```

### Cyrano Whisper Channel

AI assistant guidance with contextual awareness.

```tsx
import { esiCyrano, esiHalo } from '@affectively/aeon-pages-runtime/router';

// Generate AI whisper for user guidance
const whisper = esiCyrano({
  intent: 'guide',
  tone: 'warm',
  context: sessionContext,
});

// Halo insights for behavioral patterns
const insight = esiHalo({
  observation: 'user-hesitation',
  action: 'offer-help',
});
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `ESI.Provider` | Root ESI context provider |
| `ESI.Infer` | AI inference at render time |
| `ESI.Translate` | Automatic translation |
| `ESI.TranslationProvider` | App-wide translation context |
| `ESI.TierGate` | Tier-based content gating |
| `ESI.EmotionGate` | Emotion-based content gating |
| `ESI.TimeGate` | Time-based content gating |
| `ESI.If` / `ESI.Show` / `ESI.Hide` | Conditional rendering |
| `ESI.Match` / `ESI.Case` | Pattern matching |
| `ESI.ABTest` | A/B testing |
| `ESI.ForEach` | AI-powered iteration |
| `ESI.Select` | AI-powered selection |

### Hooks

| Hook | Description |
|------|-------------|
| `useESI()` | Access ESI context and processing |
| `useESIInfer()` | AI inference hook |
| `useTranslation()` | Translation context access |
| `useTranslationObserver()` | Auto-translate data-attribute elements |
| `useGlobalESIState()` | Access global ESI state |
| `useESITier()` | Get current user tier |
| `useESIEmotionState()` | Get current emotion state |

### Functions

| Function | Description |
|----------|-------------|
| `esiTranslate()` | Create translation directive |
| `translateWithAIGateway()` | Direct AI Gateway translation |
| `normalizeLanguageCode()` | Normalize language code |
| `getSupportedLanguages()` | Get list of supported languages |
| `initTranslationObserver()` | Auto-init DOM translation observer |

## Configuration

### Head Meta Tags

```html
<!-- Default translation language -->
<meta name="aeon-language" content="es">

<!-- Translation endpoint -->
<meta name="aeon-translation-endpoint" content="https://ai-gateway.example.com">

<!-- Cache TTL in seconds -->
<meta name="aeon-translation-cache-ttl" content="86400">
```

### ESI State

Global state is available at `window.__AEON_ESI_STATE__`:

```typescript
interface GlobalESIState {
  tier: 'free' | 'premium' | 'enterprise';
  emotion: EmotionState;
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  features: Record<string, boolean>;
}
```

## License

MIT
