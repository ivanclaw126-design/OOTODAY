# Design System

OOTODAY V1 minimal design system. Tailwind-based, pragmatic, no custom designer.

## Color Palette

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| primary | #1a1a1a | neutral-900 | Text, primary buttons |
| secondary | #f5f5f5 | neutral-100 | Backgrounds, cards |
| accent | #3b82f6 | blue-500 | Interactive elements, links |
| success | #22c55e | green-500 | Success states |
| warning | #f59e0b | amber-500 | Rate limit warnings |
| error | #ef4444 | red-500 | Error states |
| neutral-light | #fafafa | neutral-50 | Page background |
| neutral-mid | #d4d4d4 | neutral-300 | Borders, dividers |
| neutral-dark | #525252 | neutral-600 | Secondary text |

## Typography

| Token | Tailwind Classes | Usage |
|-------|------------------|-------|
| heading-lg | text-2xl font-semibold | Page titles |
| heading-md | text-xl font-medium | Section headers |
| body | text-base | Default text |
| body-sm | text-sm | Secondary text, labels |
| caption | text-xs | Timestamps, stats |

Font: System font stack (Tailwind default). No custom font.

## Spacing

| Token | Tailwind | Usage |
|-------|----------|-------|
| space-xs | gap-1 (4px) | Icon + text |
| space-sm | gap-2 (8px) | Element spacing |
| space-md | gap-4 (16px) | Section spacing |
| space-lg | gap-6 (24px) | Screen sections |
| space-xl | gap-8 (32px) | Major separation |

Page padding: p-4 (mobile), p-6 (desktop).

## Components

### Button Primary
```html
<button class="bg-neutral-900 text-white px-4 py-2.5 rounded-md hover:bg-neutral-700">
  穿这套
</button>
```

### Button Secondary
```html
<button class="bg-neutral-100 text-neutral-900 px-4 py-2.5 rounded-md border border-neutral-300 hover:bg-neutral-200">
  换了别的
</button>
```

### Card
```html
<div class="bg-white rounded-lg shadow-sm p-4">
  <!-- content -->
</div>
```

### Badge (Category Label)
```html
<span class="bg-neutral-100 text-sm px-2 py-1 rounded-full">
  上衣
</span>
```

### Input
```html
<input class="border border-neutral-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
```

### Toast
```html
<div class="bg-neutral-900 text-white px-4 py-2 rounded-md fixed bottom-4 left-1/2 -translate-x-1/2">
  已添加!
</div>
```

### Tab
```html
<button class="text-sm px-3 py-2.5 border-b-2 border-transparent hover:border-neutral-300 active:border-blue-500">
  上衣
</button>
```

### Spinner
```html
<div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
```

## Image Treatment

| Element | Classes |
|---------|---------|
| Outfit card | object-cover rounded-lg aspect-[3/4] |
| Wardrobe grid | object-cover rounded-md aspect-square min-w-20 |
| OOTD photo | object-cover rounded-lg max-h-40 |

## Icons

Source: Heroicons (MIT license).

- camera: Upload from camera
- photo: Upload from album
- link: E-commerce link
- plus: Add item
- check: Success
- x: Cancel/delete
- chevron-left/right: Carousel
- sun/cloud/rain: Weather

## Responsive

| Breakpoint | Tailwind | Wardrobe Grid |
|------------|----------|---------------|
| Mobile | default | 3 columns |
| Tablet | sm (640px+) | 4 columns |
| Desktop | md (768px+) | 6 columns |

## Accessibility

- Touch targets: 44px minimum (py-2.5 on buttons)
- Color contrast: AA minimum, AAA for primary text
- Screen reader: aria-label on all dynamic content
- Motion: prefers-reduced-motion respected
- Focus: visible ring on all interactive elements