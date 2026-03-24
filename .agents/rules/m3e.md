---
trigger: manual
---

# Material 3 Expressive (M3E) Design System & Skill-Set

## Core Philosophy
Material 3 Expressive transformiert funktionale Interfaces in emotionale Erlebnisse. Als Coding-Agent ist dein Ziel die Erstellung von Web-Interfaces, die "lebendig" wirken, ohne die Google-Design-Logik zu verletzen.

## 1. Color System: Dynamic & Harmonic
- **Tonal Palettes:** Nutze niemals statische Hex-Werte für Primärfarben allein. Generiere ein Schema aus 5 Tonal Palettes (Primary, Secondary, Tertiary, Neutral, Neutral Variant).
- **Expressive Accent:** Nutze die *Tertiary*-Farbe für expressive Akzente und Call-to-Actions, die sich vom restlichen Flow abheben sollen.
- **Dynamic Color Logic:** Implementiere Logiken, die auf `source-color` basieren. In CSS/Web: Nutze CSS-Variablen, die bei Bedarf via JS (Material Color Utilities) angepasst werden können.

## 2. Typography: Variable & Bold
- **Font Choice:** Nutze vorzugsweise "Google Sans" oder hochqualitative variable Serif-Schriften für Headlines, um Kontrast zu schaffen.
- **Scale:** Halte dich an die M3 Type Scale (Display, Headline, Title, Body, Label).
- **Expressivity:** Für expressive Web-Designs dürfen `Display Large` und `Headline Large` extrem skaliert werden (Fluid Typography), um Leerraum zu füllen.

## 3. Shape & Geometry: The "Extra Rounded" Look
- **Standard Radius:** Container nutzen standardmäßig `28px` (Extra Large) oder `16px` (Medium).
- **Custom Shapes:** Material 3 Expressive erlaubt asymmetrische Ecken für dekorative Elemente (z.B. `top-left: 28px`, `bottom-right: 0px`), um einen handwerklichen Look zu erzeugen.
- **Components:** Buttons sind voll abgerundet (Pill-shape).

## 4. Elevation & State
- **No Shadows:** M3 nutzt primär *Tonal Elevation* (Farbebene) statt Schatten. Höhere Ebenen werden heller (im Light Mode) oder farblich intensiver (im Dark Mode).
- **State Layers:** Interaktionen (Hover, Press, Focus) werden durch ein semi-transparentes Overlay der jeweiligen On-Color (z.B. `on-surface` bei 8% Deckkraft) visualisiert.

## 5. Layout: The Canonical Grid
- **Adaptive Modules:** Nutze keine starren Breakpoints. Nutze "Canonical Layouts":
  - *List/Detail* für Dashboards.
  - *Supporting Panel* für komplexe Web-Apps.
  - *Feed* für Content-fokussierte Seiten.
- **Margins/Gutters:** Mobile: 16px. Tablet/Desktop: 24px+.

## 6. Motion & Interaction
- **Easing:** Nutze ausschließlich `Emphasized` Easing (Eased in/out mit starkem Fokus auf den Start der Bewegung).
- **Duration:** 200ms bis 500ms je nach Objektgröße.
- **Transitions:** Elemente sollten sich nicht nur einblenden, sondern organisch "wachsen" (Shared Axis oder Container Transform).

## Implementation Instructions for the Agent
1. **HTML:** Nutze semantische Tags. Komponenten-Struktur folgt der M3-Nomenklatur (z.B. `m3-navigation-bar`, `m3-fab`).
2. **CSS:** Implementiere das Farbsystem über HCT (Hue, Chroma, Tone) oder konvertierte LCH-Werte für bessere Farbwahrnehmung.
3. **Components:** Priorisiere die Nutzung von Web Components (Lit) oder Material UI Libraries, die M3 unterstützen.