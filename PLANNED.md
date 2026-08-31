# Planned apps: Ideas and Salud

Two apps are designed but not yet built. This file keeps what was decided so
nothing is lost until they land; delete each section when its app ships.
Two guardrails will demand these values the moment an id is added to
`APP_IDS`: `Motif.tsx`'s `Record<AppHue, MotifShapes>` will not compile
without the app's drawing, and `registry.test.ts` fails until its
`--color-app-*` token is in `index.css`.

## Registry order

Ideas goes beside Notas (the capture apps); Salud after Gastos (the records):

```
tareas, compras, fechas, notas, ideas, viajes, documentos, gastos, salud, recetas, guias
```

At 11 apps the home grid needs one filler tile at both widths.

## Ideas

- **Colour**: `--color-app-ideas: #7d5c39` — kraft, 31°, S37, 4.88:1 against
  the bone ink. The low-saturation warm family: sketch paper. Distinct from
  the graphite (achromatic) and from Fechas' terracotta (much more saturated).
- **No `useUpcoming`**: an idea has no date. The kraft slot is only viable
  because of this — it never has to be told apart as a 12px chip.
- **Motif — "chispa"**: a ring of eight small diamonds around the content,
  radius 26, plus the shared joints. In `Motif.tsx` terms:
  - `center`: `diamond(50, 24, 5)`, `diamond(68.4, 31.6, 5)`,
    `diamond(76, 50, 5)`, `diamond(68.4, 68.4, 5)`, `diamond(50, 76, 5)`,
    `diamond(31.6, 68.4, 5)`, `diamond(24, 50, 5)`, `diamond(31.6, 31.6, 5)`
  - `accent`: `disc(50, 50, 7)`
- **Icon in the mockups**: Tabler `bulb`.

## Salud

- **Colour**: `--color-app-salud: #8a7218` — mustard, 47°, S70, 3.75:1
  against the bone ink. The palette's one yellow, pushed as yellow as bone
  ink allows; it clears the 3.0 floor for the tile's 24px name and 36px icon
  but is the only app value under 4.5 — the price of yellow. Chosen over a
  jade green because **Salud feeds Próximo**: its 12px chip sits beside
  Tareas' olive, and yellow-vs-green separates by category where
  green-vs-green (the jade, tried first) did not.
- **`useUpcoming`: yes** — health expiries and the like belong on the home
  strip. If its colour is ever revisited, recheck the chip against the olive
  first.
- **Motif — "cruz"**: a solid cross behind the content, plus the shared
  joints. In `Motif.tsx` terms:
  - `center`: `'M43 20 H57 V43 H80 V57 H57 V80 H43 V57 H20 V43 H43 Z'`
  - `accent`: `diamond(33, 33, 4.5)`, `diamond(67, 33, 4.5)`,
    `diamond(67, 67, 4.5)`, `diamond(33, 67, 4.5)`
- **Icon in the mockups**: Tabler `heart`.

## Not designed yet

Their tables, screens, fields and search behaviour. Only the identity above
(place, colour, motif, Próximo participation) is settled.
