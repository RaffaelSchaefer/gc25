# Eventplaner Design Guidelines

Diese Guideline dokumentiert die visuelle Sprache des Eventplaners (GC25). Sie dient als Referenz für Farben, Gradients, Typografie, Icons, Abstände, Radius, Schatten sowie wiederkehrende Komponenten-Patterns.

## Farben

Primärfarbe (OKLCH, Indigo-Range):

- Light: `--primary: oklch(0.72 0.2 268)`, `--primary-foreground: oklch(0.985 0 0)`
- Dark: `--primary: oklch(0.64 0.18 268)`, `--primary-foreground: oklch(0.985 0 0)`

Grundfarben und Oberflächen:

- Hintergrund: `--background`, Text: `--foreground`
- Card: `--card`, `--card-foreground`
- Popover: `--popover`, `--popover-foreground`

Neutrale und Hilfsfarben:

- Secondary/Muted/Accent teilen dieselbe neutrale Palette
  - Light: `--secondary|--muted|--accent: oklch(0.967 0.001 286.375)`
  - Dark: `--secondary|--muted|--accent: oklch(0.274 0.006 286.033)`
- Border/Input: Light `oklch(0.92 0.004 286.32)`; Dark `oklch(1 0 0 / 10–15%)`
- Ring: `--ring: var(--primary)`
- Destructive: Light `oklch(0.577 0.245 27.325)`, Dark `oklch(0.704 0.191 22.216)`

Charts (Beispiele): `--chart-1` bis `--chart-5` in OKLCH (siehe `globals.css`).

Empfehlungen:

- Primäraktionen stets `bg-primary` und `text-primary-foreground` nutzen.
- Für Rahmen und Trennlinien `border` verwenden, Deckkraft in Dark per Token geregelt.

## Gradients

Hintergrund- und Text-Gradients sind zentraler Teil der Marke:

- Page/Hero Background: `bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900` (Dark Hero)
- Interaktiver Radial-Glow: `radial-gradient(circle at <mouse x/y>, rgba(147,51,234,0.3) 0%, transparent 50%)`
- Grid Overlay: `bg-[linear-gradient(rgba(147,51,234,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(147,51,234,0.1)_1px,transparent_1px)]` mit `bg-[size:50px_50px]`
- Text-Gradient (Hero/Login Title): `bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent`
- CTA Buttons: `bg-gradient-to-r from-purple-600 to-purple-500` mit Hover nach `from-purple-500 to-purple-400`
- Fade Bottom: `bg-gradient-to-t from-gray-900 to-transparent`

Richtlinien:

- Für CTA-Buttons violett-Lineargradient mit leichter Hover-Verschiebung verwenden.
- Text-Gradient sparsam für prominente Headlines einsetzen (nicht für Fließtext).
- Overlay-Grid nur auf Hero/Login-Hintergründen, nicht in Content-Bereichen.

## Typografie

- Fonts: Google Geist Sans/Mono
  - `--font-geist-sans` (Standard), `--font-geist-mono` (Code/Monospace)
  - Eingebunden in `RootLayout` und via `antialiased` aktiviert.
- Größen und Gewicht:
  - Basis: `text-sm` bis `text-base` für Fließtext.
  - Buttons: `text-sm font-medium`.
  - Headlines: z. B. Hero `text-5xl md:text-7xl font-bold`.

Empfehlungen:

- Keine zu vielen Gewichtungen mischen; bevorzugt `font-medium` bis `font-semibold`.
- Für Sekundärtexte `text-muted-foreground` einsetzen.

## Icons

- Bibliothek: `lucide-react`
- Typische Größen:
  - Inline in Buttons/Listen: `size-4` bzw. `w-4 h-4`
  - Info-Karten/Feature-Grid: `w-6 h-6`
  - Klein in Navigations- oder Einstellungs-Listen: `h-4 w-4`
- Farbe/Styling:
  - Akzent: `text-purple-400` auf dunklem Untergrund.
  - Erben standardmäßig `currentColor` (Button/Link-Farbe), somit keine Inline-Farben, wenn nicht nötig.

Richtlinien:

- Icons immer mit Text kombinieren, außer bei reinen Icon-Buttons (`size="icon"`).
- Abstände: `gap-2` in Buttons, `gap-1.5` bei kleinen Buttons.

## Abstände, Radius, Schatten

- Spacing Tokens (Beispiele): `--space-1` bis `--space-8` (0.25–2rem). In Komponenten bevorzugt Tailwind-Spacings (`px-6`, `py-6`, `gap-6`).
- Radius:
  - Global: `--radius: 0.75rem` (12px)
  - Ableitungen: `rounded-md`/`rounded-lg`/`rounded-xl` – Card/CTA häufig `rounded-xl`.
- Schatten:
  - Standard: `shadow-sm`/`shadow-xs` in UI-Basis
  - Größer für Cards/CTAs: `shadow-md`/`shadow-lg` und violette Schattierung (`shadow-purple-500/20`)

Empfehlungen:

- Konsistent `rounded-xl` für prominente Container (Cards, CTA) nutzen.
- Fokus klar sichtbar: Rings basieren auf `--ring` (Primary), z. B. `focus-visible:ring-[3px]`.

## Komponenten-Patterns

- Button (`components/ui/button.tsx`):
  - Varianten: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
  - Größen: `sm`, `default`, `lg`, `icon`
  - Icon-Größe per Selector standardisiert: `[&_svg:not([class*='size-'])]:size-4`
- Card (`components/ui/card.tsx`):
  - Außen: `rounded-xl border py-6 shadow-sm`
  - Innen: Header/Footer `px-6`, Content `px-6`
- Hero/Login:
  - Gradient-Hintergrund, Grid-Overlay, Radial-Glow auf Mausposition
  - CTA 1: Gradient-Button, CTA 2: `variant="outline"` mit violettem Border

### Event Cards (mit blurry Background-Icon)

Ziel: Event-Karten mit dezentem, unscharfem Marken-Icon im Hintergrund, ohne die Lesbarkeit zu beeinträchtigen.

Layering (Bottom → Top):

- Basis: Card-Container (`rounded-xl border py-6 shadow-sm`) mit subtiler Verlauf-Fläche für Tiefe.
- Background-Glow (optional): abgerundeter Radialverlauf mit geringer Opazität, um den Icon-Halo zu erzeugen.
- Blurry Icon: übergroßes Icon mit starker Unschärfe, geringer Opazität, außerhalb der Safe-Zone positioniert.
- Foreground: Titel, Meta, Actions – klare Typografie und ausreichender Kontrast.

Empfohlene Klassen/Token:

- Card-Background (Dark): `bg-gradient-to-br from-purple-500/5 via-gray-900/60 to-gray-900/50 backdrop-blur-xl` plus `border border-purple-500/20 ring-1 ring-purple-500/20`
- Background-Glow: `bg-[radial-gradient(circle,rgba(147,51,234,0.25)_0%,transparent_60%)]`
- Blurry Icon: `opacity-10 text-purple-400/80 blur-2xl` (in Light ggf. `opacity-15 text-purple-600/40 blur-xl`)

Platzierung & Größe:

- Position: oben rechts oder unten rechts außerhalb der Content-Safe-Zone (`-top-6 -right-6` bis `-top-12 -right-12`).
- Größe: 96–160px (z. B. `h-32 w-32` bis `h-40 w-40`).
- Safe-Zone: Inhalt nutzt Card-Insets (`px-6`), Hintergrund-Icon darf Titel/CTA nicht überlagern.

Hover/Focus-Verhalten:

- Card: `hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/40` und ggf. `transition-all duration-300`.
- Blurry Icon: leichte Skalierung/Parallaxe mit `group-hover:scale-105 group-hover:rotate-1` (sparsam einsetzen).
- Fokus: deutlicher Ring über Tokens, z. B. `focus-visible:ring-[3px]`.

Typografie & Meta:

- Titel: `font-semibold` bis `font-bold`; optional dezenter Text-Gradient nur für prominente Titel.
- Meta-Reihe: kleine Icons `w-4 h-4` mit `text-muted-foreground`, Text `text-sm`.

Barrierefreiheit:

- Background-Icon dekorativ halten: `aria-hidden="true"` und `pointer-events-none` nutzen.
- Kontrast prüfen: Foreground-Text gegen Verlauf/Glow ausreichend halten; keine Informationen ausschließlich im Hintergrund platzieren.

Beispiel (TSX):

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventCard() {
  return (
    <Card className="group relative overflow-hidden border border-purple-500/20 ring-1 ring-purple-500/20 bg-gradient-to-br from-purple-500/5 via-gray-900/60 to-gray-900/50 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/40">
      {/* Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.25)_0%,transparent_60%)]"
      />
      {/* Blurry Icon */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 opacity-10 text-purple-400/80"
      >
        <Calendar className="h-40 w-40 blur-2xl transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-1" />
      </div>

      <CardHeader>
        <CardTitle className="text-xl">GC25 Day Trip</CardTitle>
        <CardDescription>
          Gemeinsame Tour zur gamescom mit Zeitplan
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>24.08.2025 · 10:00–18:00</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>Köln Messe</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          size="lg"
          className="px-5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
        >
          Mitmachen
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
        >
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
```

Do/Don'ts (Event Cards):

- Do: Hintergrund-Icon dekorativ und subtil halten (niedrige Opazität, starke Unschärfe).
- Do: Safe-Zone respektieren; Icon nicht mit Titel/CTAs kollidieren lassen.
- Don't: Hintergrund-Icon als einziges Transportmittel für relevante Informationen verwenden.
- Don't: Zu starke Animation/Parallaxe – nur leichte, performante Effekte.

Do/Don'ts:

- Do: Primary-Aktionen mit Primary- oder violetten CTA-Gradients hervorheben.
- Do: `text-muted-foreground` für Beschreibungen statt reduzierte Opacity nutzen.
- Don't: Text-Gradient für lange Texte einsetzen.
- Don't: Zu starke Schatten auf dunklen Flächen kombinieren – `shadow-*` mit geringer Opazität wählen.

## Barrierefreiheit

- Fokus: `focus-visible` Ringe deutlich sichtbar, Kontrast auf Buttons/Links prüfen.
- Reaktionszeiten: Animationen auf ~200–300ms halten, keine übermäßigen Parallax-Effekte.
- Farben: Primärfarbe mit Weiß/Schwarz-Kontrast testen; Tokens bieten helle/dunkle Foregrounds.

## Beispiel-Snippets

- CTA-Primärbutton:
  - `className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"`

- Card mit Verlauf:
  - `className="border border-purple-500/20 ring-1 ring-purple-500/20 backdrop-blur-xl bg-gradient-to-br from-purple-500/5 via-gray-900/60 to-gray-900/50"`

## Pflege und Erweiterung

- Neue Komponenten orientieren sich an bestehenden Tokens (`globals.css`).
- Gradients zentralisieren, wenn dieselben Muster häufiger vorkommen (Utility-Klassen oder CSS-Custom-Properties).
- Icon-Größen einheitlich halten; neue Icons aus `lucide-react` beziehen.
