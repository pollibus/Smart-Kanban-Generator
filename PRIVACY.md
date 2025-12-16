# Privacy Policy

**Last Updated:** January 2025

## Overview

Smart Kanban Generator is committed to protecting your privacy. This extension operates entirely client-side and collects minimal data necessary for its core functionality.

## Data Collection

### What We Collect
- **OpenAI API Key**: Stored locally in your browser (`chrome.storage.sync`)
- **Language Preference**: Stored locally to remember your language choice
- **Product Data Cache**: Extracted product information cached locally for 24 hours

### What We DON'T Collect
- ❌ No personal information
- ❌ No browsing history
- ❌ No tracking or analytics
- ❌ No user accounts or registration
- ❌ No cookies beyond browser extension storage

## Data Storage

### Local Browser Storage (`chrome.storage.sync`)
- **OpenAI API Key**: Encrypted by Chrome, synced across your devices if signed into Chrome
- **Language Preference**: Plain text, synced across devices
- **Purpose**: Convenience - you only need to configure once

### Local Browser Storage (`chrome.storage.local`)
- **Cached Product Data**: Temporary storage for 24 hours to avoid redundant API calls
- **Print Data**: Temporarily stored when opening print view, cleared after closing
- **Purpose**: Performance optimization and cost savings

## Third-Party Services

### OpenAI API
- **Data Sent**: Product information (title, price, quantity, supplier, image URL) from pages you analyze
- **Purpose**: Data normalization and structuring
- **OpenAI Privacy Policy**: [https://openai.com/policies/privacy-policy](https://openai.com/policies/privacy-policy)
- **Data Retention**: See OpenAI's policy
- **Your Control**: You provide the API key, you control the data sent

### No Other Third Parties
- We do **NOT** use:
  - Google Analytics
  - Error tracking services
  - Advertising networks
  - Social media integrations
  - Any other external services

## Permissions Explained

The extension requests these Chrome permissions:

### `activeTab`
- **Why**: To extract product data from the currently viewed page
- **When**: Only when you click "Analyze Product Data"
- **Scope**: Current tab only, not background tabs

### `storage`
- **Why**: To save your API key, language preference, and cache
- **Data**: As described in "Data Storage" section above

### `scripting`
- **Why**: To inject content script for DOM extraction
- **When**: On product pages where you use the extension

### `host_permissions` (https://api.openai.com/*)
- **Why**: To communicate with OpenAI API for data normalization
- **When**: Only when analyzing a product (not cached)

## Data Security

- ✅ **HTTPS Only**: All API communication encrypted
- ✅ **No Backend Server**: Extension runs entirely in your browser
- ✅ **Minimal Permissions**: We request only what's necessary
- ✅ **Open Source**: Code is publicly auditable
- ✅ **Manifest V3**: Uses latest, most secure Chrome extension standard

## Your Rights

### Access
- All data is stored locally in your browser
- View via Chrome DevTools → Application → Storage → Extension Storage

### Deletion
1. **Clear Cache**: Uninstall extension or clear browser data
2. **Remove API Key**: Extension Settings → Delete API key → Save
3. **Complete Removal**: Uninstall extension from `chrome://extensions/`

### Export
- No export functionality (all data is local, you have full access via browser tools)

## Children's Privacy

This extension is not directed at children under 13. We do not knowingly collect data from children.

## Changes to Privacy Policy

We may update this policy. Material changes will be noted in:
- This document's "Last Updated" date
- Extension update notes (if distributed via Chrome Web Store)

## Contact

Questions about privacy?
- GitHub Issues: https://github.com/pollibus/Smart-Kanban-Generator/issues

---

## Summary (TL;DR)

- ✅ **100% Local**: Extension runs in your browser, no external servers
- ✅ **Your Data**: API key and cache stored locally, you control it
- ✅ **One Third Party**: OpenAI (only for normalization, controlled by you)
- ✅ **No Tracking**: Zero telemetry, analytics, or user profiling
- ✅ **Open Source**: Fully auditable code

**Your privacy is respected. Period.**
