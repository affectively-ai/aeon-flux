# @affectively/aeon-pages-react

React bindings for `@affectively/aeon-pages` with collaborative presence UI.

## Presence Flight-Deck Scroll UX

The Presence Kit includes a social, performance-oriented collaborative scrollbar:

- `PresenceScrollBar`: standalone rail + legend for collaborator scroll telemetry.
- `CollaborativePresenceScrollContainer`: content container with an interactive collaborative rail.
- `PresenceElementsPanel`: combined presence panel (cursor/focus/typing/selection/scroll/viewport/input/emotion).

### Theme Tokens

Use `PresenceScrollThemeTokens` to style rails consistently across apps:

```tsx
import {
  CollaborativePresenceScrollContainer,
  PresenceElementsPanel,
  type PresenceScrollThemeTokens,
  type PresenceUser,
} from '@affectively/aeon-pages-react';

const scrollTheme: PresenceScrollThemeTokens = {
  accentColor: '#ccff00',
  railSurfaceColor: 'linear-gradient(180deg, #0a0f13, #0d1319)',
  railBorderColor: 'rgba(204, 255, 0, 0.28)',
  textColor: '#e8f6b2',
  mutedTextColor: '#9fb371',
};

function FlightDeck({
  presence,
  localUserId,
}: {
  presence: PresenceUser[];
  localUserId: string;
}) {
  return (
    <CollaborativePresenceScrollContainer
      presence={presence}
      localUserId={localUserId}
      height={420}
      accentColor={scrollTheme.accentColor}
      theme={scrollTheme}
    >
      <PresenceElementsPanel
        presence={presence}
        localUserId={localUserId}
        scrollTheme={scrollTheme}
      />
    </CollaborativePresenceScrollContainer>
  );
}
```

### Keyboard + Accessibility

`CollaborativePresenceScrollContainer` rail is keyboard operable:

- `ArrowUp` / `ArrowDown`
- `PageUp` / `PageDown`
- `Home` / `End`

The rail exposes `role="scrollbar"` semantics and collaborator context for assistive tech.

### Advanced Signal API

For custom rails and telemetry UIs, these exports are available:

- `buildScrollSignals`
- `sortScrollSignalsForRail`
- `sortScrollSignalsForLegend`
- `buildScrollDensityMap`
- `computeScrollActivity`
- `shouldCommitLocalDepthUpdate`
- `PresenceScrollSignal` type and defaults (`DEFAULT_SCROLL_*`)
