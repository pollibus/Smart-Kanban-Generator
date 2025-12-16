// Options page script
// Handles API key configuration and language settings

const form = document.getElementById('settingsForm');
const apiKeyInput = document.getElementById('apiKey');
const languageSelect = document.getElementById('language');
const toggleBtn = document.getElementById('toggleApiKey');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');

// Initialize i18n and load settings
(async () => {
  await initI18n();
  translatePage();
  loadSettings();
})();

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(['openaiApiKey', 'language'], (result) => {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
    if (result.language) {
      languageSelect.value = result.language;
    }
  });
}

// Handle language change
languageSelect.addEventListener('change', async () => {
  const newLang = languageSelect.value;
  await setLanguage(newLang);
  translatePage();
  showStatus(t('options.messages.saved'), 'success');
});

// Toggle API key visibility
toggleBtn.addEventListener('click', () => {
  const type = apiKeyInput.type === 'password' ? 'text' : 'password';
  apiKeyInput.type = type;
});

// Test API key
testBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus(t('options.messages.emptyKey'), 'error');
    return;
  }

  showStatus('Testing...', 'loading');
  testBtn.disabled = true;

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      showStatus(t('options.messages.testSuccess'), 'success');
    } else if (response.status === 401) {
      showStatus(t('options.messages.testError', { error: 'Invalid API key' }), 'error');
    } else {
      showStatus(t('options.messages.testError', { error: `${response.status} ${response.statusText}` }), 'error');
    }
  } catch (error) {
    showStatus(t('options.messages.testError', { error: error.message }), 'error');
  } finally {
    testBtn.disabled = false;
  }
});

// Save settings
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus(t('options.messages.emptyKey'), 'error');
    return;
  }

  // Validate format
  if (!apiKey.startsWith('sk-')) {
    showStatus(t('options.messages.saveError', { error: 'API key should start with "sk-"' }), 'error');
    return;
  }

  // Save to storage
  chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
    showStatus(t('options.messages.saved'), 'success');

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  });
});

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
}
