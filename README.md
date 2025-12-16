# Smart Kanban Generator

A Chrome/Edge browser extension for automatic generation of printable Kanban cards from product detail pages with LLM-based data extraction and normalization.

[Deutsche Version](#deutsche-version) | [Privacy Policy](PRIVACY.md)

## Overview

This extension automates the manual process of creating Kanban cards for operational or personal inventory management. It extracts product information from e-commerce pages, normalizes it using GPT-4o-mini, and generates print-ready Kanban cards in multiple sizes on DIN A4 paper.

### Core Features

- **Automatic DOM Extraction**: Captures product data (title, price, image, quantity, supplier) directly from product pages
- **LLM Normalization**: OpenAI GPT-4o-mini cleans and structures the data
- **Smart Caching**: 24-hour URL-based cache to avoid redundant API calls and reduce costs
- **Image Intelligence**: Filters out logos and banners, selects only actual product images
- **Editable Preview**: Manual adjustment of all fields before printing
- **Print-Optimized Layouts**: 4 card sizes (small, medium, large, A4) printed together on one page
- **QR Code Integration**: Automatic QR code generation for product links
- **Multi-Language**: English and German interface with persistent language setting
- **Offline-Capable**: No internet connection needed after extraction

## Quick Start

### 1. Installation

```bash
# Clone or download the repository
git clone https://github.com/pollibus/Smart-Kanban-Generator.git
cd Smart-Kanban-Generator
```

**Load in Chrome/Edge:**
1. Open `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `Smart-Kanban-Generator` folder

### 2. Configure OpenAI API Key

1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click the extension icon → **Settings**
3. Enter your API key and test the connection
4. Save

### 3. Create Your First Kanban Card

1. Open any product detail page (e.g., Amazon, eBay)
2. Click the Smart Kanban Generator icon
3. Click **Analyze Product Data**
4. Review and edit the extracted data
5. Select product image (if multiple available)
6. Click **Open Print View**
7. Print with **100% scaling** (important!)

## Features in Detail

### Smart Caching System

Save money on API calls with intelligent caching:
- Extracted data is cached for **24 hours** per URL
- Cache indicator shows when viewing cached data
- **Refresh button** to force re-extraction
- Cache is stored locally in your browser

**Cost savings**: Visiting the same product multiple times only costs one API call.

### Advanced Image Detection

Intelligent filtering ensures only product images are selected:
- **Logo filtering**: Excludes logos, icons, trust seals, payment badges
- **Size filtering**: Minimum 200×200px
- **Aspect ratio filtering**: Excludes banners and wide/tall images
- **Keyword detection**: Checks src, alt, class, and id attributes
- **Multiple images**: Select from all detected product images

### Print Layout

All 4 card sizes are printed on a single A4 page:
- **Small** (10 per page): Compact format with QR code
- **Medium** (4 per page): Recommended - includes image and notes
- **Large** (2 per page): Large image and detailed information
- **A4** (1 per page): Maximum readability

Simply cut out the size that best fits your needs!

### Multi-Language Support

- **English** and **German** interface
- Language setting persists across browser sessions
- Automatic translation of all UI elements
- Change language in Settings

## Architecture

### Components

```
Smart-Kanban-Generator/
├── manifest.json          # Manifest V3 configuration
├── content.js             # DOM extraction (Content Script)
├── background.js          # OpenAI API communication (Service Worker)
├── popup.html/js/css      # Main interface for data editing
├── print.html/js/css      # Print view with card layouts
├── options.html/js/css    # Settings page for API key
├── i18n.js                # Internationalization helper
├── locales/               # Translation files
│   ├── en.json            # English translations
│   └── de.json            # German translations
├── qrcode.min.js          # QR code library
├── PRIVACY.md             # Privacy policy
└── README.md              # This file
```

### Data Flow

1. **Extraction** (content.js): User opens product page → clicks extension icon → content script extracts DOM elements
2. **Cache Check** (popup.js): Check if data exists in cache (24h expiry) → use cached data or proceed
3. **Normalization** (background.js): Extracted fragments → OpenAI API → structured JSON
4. **Caching** (popup.js): Store normalized data with timestamp
5. **Editing** (popup.js): User reviews and edits data in popup
6. **Printing** (print.js): Generate A4 page with all 4 card sizes + QR codes → browser print dialog

### Security Concept

- **Manifest V3**: Modern, secure extension architecture
- **Minimal Permissions**: Only `activeTab`, `storage`, `scripting`
- **Local Storage**: API key only in `chrome.storage.sync`
- **No Crawling**: User-initiated process, no automatic access
- **CORS via Background**: API calls only through service worker
- **No Tracking**: Zero telemetry or analytics

## Supported E-commerce Sites

Tested and optimized for:
- **Amazon** (all country versions)
- **eBay**
- **Shop Apotheke** (Germany)
- **Shopify stores** (standard templates)
- **WooCommerce stores**
- Most common e-commerce platforms

The multi-level selector strategy ensures broad compatibility.

## Data Structure

```json
{
  "title_short": "Miele Dishwasher Tabs, 16 pieces",
  "price": "14.99 €",
  "quantity_unit": "16 pieces",
  "supplier": "Miele",
  "image_url": "https://...",
  "product_url": "https://...",
  "reorder_level": "1 package",
  "order_quantity": "1 package",
  "notes": ""
}
```

### Cache Structure

```json
{
  "cache_https://example.com/product": {
    "timestamp": 1704067200000,
    "data": { /* normalized product data */ }
  }
}
```

Cache expires after 24 hours and is stored in `chrome.storage.local`.

## Technical Details

### DOM Extraction Strategy

Multi-level selector cascade:

1. **Shop-specific selectors** (Amazon, eBay, etc.)
2. **Semantic HTML attributes** (`itemprop`, `data-testid`)
3. **Meta tags** (`og:title`, `product:price`)
4. **Generic CSS classes** (`.product-title`, `.price`)
5. **Fallback to generic elements** (`h1`, `img`)

**Lazy Loading Handling**: Extracts `currentSrc` instead of `src` for actually loaded images.

**Price Extraction**: 30+ selectors with currency symbol fallback for European and US formats.

### Image Filtering Logic

```javascript
function isValidProductImage(img) {
  // 1. Size check (min 200x200px)
  if (img.naturalWidth < 200 || img.naturalHeight < 200) return false;

  // 2. Aspect ratio check (between 1:4 and 4:1)
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  if (aspectRatio > 4 || aspectRatio < 0.25) return false;

  // 3. Logo detection in URL/alt/class/id
  if (isLogoUrl(src) || isLogoUrl(alt)) return false;

  return true;
}
```

### LLM Prompt Strategy

**System Prompt**:
- Strict JSON schema specification
- Deterministic output format
- Normalization rules for prices, quantities, titles
- Fallback strategy for missing data

**Temperature**: 0.1 (maximum predictability)

**Response Format**: `json_object` (enforces valid JSON)

### Print Layout

**CSS Grid** with precise mm units:
- `@page { size: A4; margin: 10mm; }`
- Fixed card sizes in mm
- `page-break-inside: avoid` for clean breaks
- `<img>` tags with `object-fit: contain` for reliable printing
- `crossOrigin="anonymous"` for CORS handling

**Browser Compatibility**:
- Optimized for Chrome/Edge print engine
- 100% scaling recommended
- No PDF generation needed

## Costs

**OpenAI API (GPT-4o-mini)**:
- Input: ~200 tokens per request
- Output: ~150 tokens per request
- Cost: ~$0.0005 - $0.001 per card
- Monthly (100 cards): ~$0.05 - $0.10

**With caching**: Revisiting the same product costs nothing!

## Development

### Debugging

**Content Script**:
```javascript
// In browser DevTools console on product page
chrome.runtime.sendMessage({action: 'extractProductData'}, console.log)
```

**Background Script**:
```bash
# In chrome://extensions/ → Extension → Click "Service Worker"
# console.log() outputs appear in separate DevTools instance
```

**Popup**:
```bash
# Right-click on extension popup → "Inspect"
```

### Testing Changes

1. Make code changes
2. Go to `chrome://extensions/` → Extension → Click **Reload** icon
3. Open extension again to test

### Adding New Features

**Add new shop support**:
- Add selectors in `content.js` → `extractTitle()`, `extractPrice()`, etc.
- Test with `chrome.runtime.sendMessage()`

**Add new fields**:
1. `content.js`: Add extraction function
2. `background.js`: Extend prompt schema
3. `popup.html`: Add form field
4. `print.html`: Add template field
5. `print.css`: Add styling
6. `locales/*.json`: Add translations

## Troubleshooting

### "No product data found"
- Make sure you're on a **product detail page** (not category/search)
- Check browser console for errors
- Try a different product page
- Clear cache and try again (Refresh button)

### "OpenAI API Error: 401"
- API key invalid or expired
- Check in Settings → "Test Connection"
- Get new API key from OpenAI

### "QR Code not available"
- `qrcode.min.js` missing → check installation
- Check browser console for errors

### Print layout incorrect
- Select **100% scaling** in print dialog (not "Fit to page")
- Use Chrome/Edge (Firefox has different print engine)
- Check page margins (default: 10mm)

### Images appear as black frames when printing
- This should be fixed in current version (using `<img>` tags)
- If issue persists, check browser console for CORS errors
- Try different product image from gallery

### Cache not working
- Check browser storage: DevTools → Application → Storage → Extension Storage
- Clear all cache: Settings → Clear Cache (if implemented) or reinstall extension

## Privacy & Legal

### Privacy
- **100% Local**: Extension runs entirely in your browser
- **No Tracking**: Zero telemetry, analytics, or user profiling
- **One Third Party**: OpenAI (only for normalization, controlled by you)
- **Your Data**: API key and cache stored locally, you control it
- **Open Source**: Fully auditable code

See [PRIVACY.md](PRIVACY.md) for complete privacy policy.

### Copyright
- Extension only extracts data the user already sees
- No automatic crawling
- Product images are only referenced, not downloaded
- User is responsible for lawful use

## License

MIT License - Free to use for personal and commercial projects

See [LICENSE](LICENSE) for details.

## Roadmap

- [x] Multi-language support (English/German)
- [x] Smart caching system
- [x] Advanced image filtering
- [x] All card sizes with images
- [ ] Template system for shop-specific extractors
- [ ] Batch mode (multiple products at once)
- [ ] Local storage for generated cards
- [ ] PDF export (optional)
- [ ] Barcode support (in addition to QR)
- [ ] More languages (French, Spanish, Italian)
- [ ] Offline LLM option (Ollama)
- [ ] Context menu integration (right-click → "Create Kanban card")
- [ ] Chrome Web Store publication

## Support

For issues or questions:
1. Check README.md troubleshooting section
2. Check browser console for errors
3. Create an issue on [GitHub Issues](https://github.com/pollibus/Smart-Kanban-Generator/issues)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Credits

- **QR Code Library**: [qrcodejs](https://github.com/davidshimjs/qrcodejs) by David Shim
- **LLM**: OpenAI GPT-4o-mini
- **Icons**: Bootstrap Icons

---

## Deutsche Version

Eine Chrome/Edge Browser-Erweiterung zur automatischen Generierung druckbarer Kanban-Karten aus Produktdetailseiten mit LLM-basierter Datenextraktion.

### Hauptfunktionen

- ✅ Automatische Produktdaten-Extraktion von E-Commerce-Seiten
- ✅ KI-basierte Datennormalisierung mit GPT-4o-mini
- ✅ Intelligentes Caching (24h) spart API-Kosten
- ✅ Intelligente Bilderkennung filtert Logos automatisch
- ✅ 4 Kartengrößen auf einer A4-Seite
- ✅ Deutsch und Englisch
- ✅ QR-Code für Produktlink
- ✅ 100% lokal, keine Datensammlung

### Installation

1. Repository herunterladen
2. `chrome://extensions/` öffnen
3. **Entwicklermodus** aktivieren
4. **Entpackte Erweiterung laden**
5. Ordner auswählen

### Verwendung

1. Produktseite öffnen (z.B. Amazon)
2. Extension-Icon klicken
3. "Produktdaten analysieren"
4. Daten prüfen/bearbeiten
5. "Druckansicht öffnen"
6. Mit **100% Skalierung** drucken

### Kosten

Ca. 0,05-0,10 € pro Monat bei 100 Karten (GPT-4o-mini). Mit Caching deutlich günstiger!

### Unterstützte Shops

Amazon, eBay, Shop Apotheke, Shopify, WooCommerce und die meisten E-Commerce-Plattformen.

### Lizenz

MIT License - Kostenlos für private und kommerzielle Nutzung

### Datenschutz

Siehe [PRIVACY.md](PRIVACY.md) für Details. Zusammenfassung:
- ✅ 100% lokal, kein Server
- ✅ API Key nur lokal gespeichert
- ✅ Kein Tracking oder Analytics
- ✅ Open Source Code

---

**Made with ❤️ for better inventory management**
