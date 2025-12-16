# Extension Icons

Die Extension benötigt Icons in folgenden Größen:
- icon16.png (16x16px)
- icon32.png (32x32px)
- icon48.png (48x48px)
- icon128.png (128x128px)

## Temporäre Lösung für Entwicklung

Die Extension funktioniert auch ohne Icons (Chrome zeigt dann ein Standard-Icon).

## Icons erstellen

### Option 1: Online Icon Generator

1. Besuche https://www.favicon-generator.org/
2. Lade ein Bild oder Logo hoch
3. Generiere Icons in allen Größen
4. Download und benenne um zu icon16.png, icon32.png, etc.

### Option 2: Mit Figma/Canva

Design ein 128x128px Icon und exportiere in allen benötigten Größen.

### Option 3: Mit ImageMagick (CLI)

```bash
# Falls du bereits ein icon.png hast:
convert icon.png -resize 16x16 icon16.png
convert icon.png -resize 32x32 icon32.png
convert icon.png -resize 48x48 icon48.png
convert icon.png -resize 128x128 icon128.png
```

## Icon-Design-Vorschlag

**Konzept**: Kanban-Board mit 3 Spalten und Karten + KI-Sparkle

**Farben**:
- Primär: #667eea (Lila-Blau, wie in der Extension)
- Akzent: #764ba2 (Dunkel-Lila)
- Hintergrund: Weiß oder Gradient

**Elemente**:
- 3 vertikale Spalten (symbolisiert Kanban)
- Kleine Karten-Rechtecke in den Spalten
- KI-Symbol (Sternchen/Sparkle) in einer Ecke
- Optional: QR-Code-Symbol
