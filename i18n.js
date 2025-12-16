// i18n - Internationalization helper
// Loads translations and provides translation function

let currentTranslations = {};
let currentLanguage = 'en';

/**
 * Initialize i18n system
 * Loads language preference from storage and translations
 */
async function initI18n() {
  try {
    // Load language preference from storage
    const result = await chrome.storage.sync.get(['language']);
    currentLanguage = result.language || 'en';

    // Load translation file
    const response = await fetch(chrome.runtime.getURL(`locales/${currentLanguage}.json`));
    currentTranslations = await response.json();

    console.log(`[i18n] Loaded language: ${currentLanguage}`);
  } catch (error) {
    console.error('[i18n] Error loading translations:', error);
    // Fallback to English
    currentLanguage = 'en';
    const response = await fetch(chrome.runtime.getURL('locales/en.json'));
    currentTranslations = await response.json();
  }
}

/**
 * Get translated string by key path
 * @param {string} keyPath - Dot-separated key path (e.g., "popup.initialState.info")
 * @param {object} replacements - Optional object with placeholder replacements
 * @returns {string} Translated string
 */
function t(keyPath, replacements = {}) {
  const keys = keyPath.split('.');
  let value = currentTranslations;

  // Navigate through nested object
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`[i18n] Translation key not found: ${keyPath}`);
      return keyPath; // Return key as fallback
    }
  }

  // Replace placeholders like {{error}}
  let result = String(value);
  for (const [key, val] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), val);
  }

  return result;
}

/**
 * Get current language code
 * @returns {string} Current language code (e.g., "en", "de")
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Change language and reload translations
 * @param {string} lang - Language code (e.g., "en", "de")
 */
async function setLanguage(lang) {
  await chrome.storage.sync.set({ language: lang });
  currentLanguage = lang;
  await initI18n();
}

/**
 * Translate all elements with data-i18n attribute
 * Usage: <div data-i18n="popup.title"></div>
 * With placeholder: <div data-i18n="errors.testError" data-i18n-replacements='{"error": "message"}'></div>
 */
function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const replacementsAttr = element.getAttribute('data-i18n-replacements');
    let replacements = {};

    if (replacementsAttr) {
      try {
        replacements = JSON.parse(replacementsAttr);
      } catch (e) {
        console.warn('[i18n] Invalid replacements JSON:', replacementsAttr);
      }
    }

    element.textContent = t(key, replacements);
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });

  // Translate titles
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = t(key);
  });
}
