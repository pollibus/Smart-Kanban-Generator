# Contributing to Smart Kanban Generator

Thank you for considering contributing to Smart Kanban Generator! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser version and OS
- Extension version

### Suggesting Features

Feature suggestions are welcome! Please:
- Check if the feature has already been requested
- Explain the use case and why it would be valuable
- Provide examples if possible

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/pollibus/Smart-Kanban-Generator.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly (see Testing section below)
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

#### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code structure
- Keep functions focused and small
- Use ES6+ JavaScript features

#### Testing Your Changes

Before submitting:

1. **Load the extension** in Chrome/Edge developer mode
2. **Test the core workflow**:
   - Extract data from multiple e-commerce sites (Amazon, eBay, etc.)
   - Verify caching works (visit same product twice)
   - Test image selection
   - Verify print output with 100% scaling
   - Test both English and German languages
3. **Check browser console** for errors
4. **Test edge cases**:
   - Pages with missing data
   - Pages with unusual layouts
   - Non-product pages

#### Adding New Features

When adding new fields or features:

1. **content.js**: Add extraction logic
2. **background.js**: Update OpenAI prompt schema if needed
3. **popup.html**: Add UI elements
4. **popup.js**: Add handling logic
5. **print.html**: Update card templates
6. **print.css**: Add styling
7. **locales/en.json** and **locales/de.json**: Add translations
8. **README.md**: Update documentation
9. **CLAUDE.md**: Update technical documentation (if applicable)

#### Adding Support for New E-commerce Sites

1. Visit the product page and inspect the DOM
2. Add site-specific selectors to `content.js`:
   - `extractTitle()` - line ~20
   - `extractPrice()` - line ~104
   - `extractQuantity()` - line ~168
   - `extractSupplier()` - line ~196
   - `extractAllImages()` - line ~138
3. Test extraction on multiple products from that site
4. Update README.md supported sites section

### Translation Contributions

We welcome translations to additional languages!

1. Copy `locales/en.json` to `locales/[LANG_CODE].json`
2. Translate all strings (keep the keys the same)
3. Add language option to `options.html` (line ~50)
4. Update README.md with new language

Supported language codes: `en`, `de`, `fr`, `es`, `it`, `pt`, `ja`, `zh`, etc.

### Documentation

- Update README.md for user-facing changes
- Update CLAUDE.md for technical/architectural changes
- Add comments for complex code
- Update troubleshooting sections if fixing common issues

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows existing style
- [ ] All files are updated (see "Adding New Features" above)
- [ ] Tested in Chrome/Edge
- [ ] No console errors
- [ ] Print output verified
- [ ] Works with caching
- [ ] Translations updated (if UI changes)
- [ ] README updated (if needed)
- [ ] Commit messages are clear

### PR Description

Include in your PR:
- **What**: Brief description of changes
- **Why**: Problem being solved or feature being added
- **How**: Technical approach (if non-obvious)
- **Testing**: What you tested and results
- **Screenshots**: Before/after (if visual changes)

## Development Setup

### Prerequisites

- Chrome or Edge browser
- Text editor (VS Code recommended)
- OpenAI API key (for testing)

### Directory Structure

```
Smart-Kanban-Generator/
├── manifest.json          # Extension config
├── content.js             # DOM extraction
├── background.js          # OpenAI API handler
├── popup.html/js/css      # Main UI
├── print.html/js/css      # Print view
├── options.html/js/css    # Settings
├── i18n.js                # Translations
├── locales/               # Translation files
├── icons/                 # Extension icons
└── qrcode.min.js          # QR library
```

### Debugging

**Content Script** (DOM extraction):
```javascript
// In browser console on product page
chrome.runtime.sendMessage({action: 'extractProductData'}, console.log)
```

**Background Script** (OpenAI API):
- Go to `chrome://extensions/`
- Find "Smart Kanban Generator"
- Click "Service Worker" link
- Check console for API logs

**Popup UI**:
- Right-click on extension popup
- Select "Inspect"

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Accept feedback gracefully
- Help others learn

## Questions?

- Check the [README](README.md) first
- Search existing issues
- Create a new issue if needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Smart Kanban Generator!
