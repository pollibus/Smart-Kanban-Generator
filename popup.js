// Popup script for Smart Kanban Generator
// Handles UI logic and coordination between content script and background

let currentProductData = null;

// DOM Elements
const states = {
  initial: document.getElementById('initialState'),
  loading: document.getElementById('loadingState'),
  error: document.getElementById('errorState'),
  edit: document.getElementById('editState')
};

const buttons = {
  extract: document.getElementById('extractBtn'),
  settings: document.getElementById('settingsBtn'),
  retry: document.getElementById('retryBtn'),
  cancel: document.getElementById('cancelBtn'),
  refresh: document.getElementById('refreshBtn'),
  print: document.getElementById('printBtn')
};

const form = {
  element: document.getElementById('productForm'),
  titleShort: document.getElementById('titleShort'),
  price: document.getElementById('price'),
  quantityUnit: document.getElementById('quantityUnit'),
  supplier: document.getElementById('supplier'),
  productUrl: document.getElementById('productUrl'),
  reorderLevel: document.getElementById('reorderLevel'),
  orderQuantity: document.getElementById('orderQuantity'),
  notes: document.getElementById('notes')
};

const errorMessage = document.getElementById('errorMessage');
const imageGallery = document.getElementById('imageGallery');
const cacheInfo = document.getElementById('cacheInfo');

let selectedImageUrl = null;
let currentUrl = null;

// Cache settings
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

// Event Listeners
buttons.extract.addEventListener('click', () => handleExtract(false));
buttons.settings.addEventListener('click', () => chrome.runtime.openOptionsPage());
buttons.retry.addEventListener('click', () => handleExtract(true)); // Force refresh on retry
buttons.cancel.addEventListener('click', () => showState('initial'));
buttons.refresh.addEventListener('click', () => handleExtract(true)); // Force refresh
form.element.addEventListener('submit', handlePrint);

// Image preview updates
form.titleShort.addEventListener('input', updatePreview);

// URL length check
form.productUrl.addEventListener('input', checkUrlLength);

// Initialize
init();

async function init() {
  await initI18n();
  translatePage();
  showState('initial');
}

/**
 * Get cached data for a URL
 */
async function getCachedData(url) {
  const cacheKey = `cache_${url}`;
  const result = await chrome.storage.local.get([cacheKey]);

  if (result[cacheKey]) {
    const cached = result[cacheKey];
    const cacheAge = Date.now() - cached.timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;

    if (cacheAge < maxAge) {
      console.log('Using cached data (age: ' + Math.round(cacheAge / 1000 / 60) + ' minutes)');
      return cached.data;
    } else {
      console.log('Cache expired, will fetch fresh data');
      // Clear expired cache
      await chrome.storage.local.remove([cacheKey]);
    }
  }

  return null;
}

/**
 * Save data to cache for a URL
 */
async function setCachedData(url, data) {
  const cacheKey = `cache_${url}`;
  await chrome.storage.local.set({
    [cacheKey]: {
      timestamp: Date.now(),
      data: data
    }
  });
  console.log('Data cached for URL:', url);
}

/**
 * Clear cache for a URL
 */
async function clearCacheForUrl(url) {
  const cacheKey = `cache_${url}`;
  await chrome.storage.local.remove([cacheKey]);
  console.log('Cache cleared for URL:', url);
}

/**
 * Handle extract button click
 * Triggers content script extraction and OpenAI normalization
 * @param {boolean} forceRefresh - If true, bypass cache and fetch fresh data
 */
async function handleExtract(forceRefresh = false) {
  showState('loading');

  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error(t('errors.noTab'));
    }

    // Check if we're on a valid page (not chrome:// or extension pages)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error(t('errors.invalidPage'));
    }

    currentUrl = tab.url;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await getCachedData(currentUrl);
      if (cachedData) {
        currentProductData = cachedData;
        populateForm(currentProductData);
        showState('edit');
        // Show cache info
        cacheInfo.classList.remove('hidden');
        return;
      }
    } else {
      // Clear cache for this URL if force refresh
      await clearCacheForUrl(currentUrl);
    }

    // Hide cache info when fetching fresh data
    cacheInfo.classList.add('hidden');

    // Extract data from page via content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractProductData' });

    if (!response || !response.success) {
      throw new Error(t('errors.extractionFailed'));
    }

    const rawData = response.data;
    console.log('Extracted raw data:', rawData);

    // Normalize data via background script (OpenAI)
    const normalizeResponse = await chrome.runtime.sendMessage({
      action: 'normalizeProductData',
      data: rawData
    });

    if (!normalizeResponse || !normalizeResponse.success) {
      throw new Error(normalizeResponse?.error || t('errors.normalizationFailed'));
    }

    currentProductData = {
      ...normalizeResponse.data,
      raw: rawData // Keep raw data for reference
    };

    console.log('Normalized data:', currentProductData);

    // Save to cache
    await setCachedData(currentUrl, currentProductData);

    // Populate form
    populateForm(currentProductData);

    // Show edit state
    showState('edit');

  } catch (error) {
    console.error('Extraction error:', error);
    showError(error.message);
  }
}

/**
 * Populate form with product data
 */
function populateForm(data) {
  form.titleShort.value = data.title_short || '';
  form.price.value = data.price || '';
  form.quantityUnit.value = data.quantity_unit || '';
  form.supplier.value = data.supplier || '';
  form.productUrl.value = data.raw?.product_url || '';
  form.reorderLevel.value = data.reorder_level || '1 Packung';
  form.orderQuantity.value = data.order_quantity || '1 Packung';
  form.notes.value = data.notes || '';

  // Check URL length and highlight if needed
  checkUrlLength();

  // Populate image gallery
  populateImageGallery(data.raw?.images || [], data.image_url);
}

/**
 * Populate image gallery with available images
 */
function populateImageGallery(images, defaultImage) {
  imageGallery.innerHTML = '';

  if (!images || images.length === 0) {
    imageGallery.innerHTML = `<p class="text-muted">${t('popup.editState.imageSelection.noImages')}</p>`;
    selectedImageUrl = defaultImage;
    return;
  }

  // Set default selection
  selectedImageUrl = defaultImage || images[0];

  images.forEach((imageUrl, index) => {
    const imageOption = document.createElement('div');
    imageOption.className = 'image-option';
    if (imageUrl === selectedImageUrl) {
      imageOption.classList.add('selected');
    }

    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `Produktbild ${index + 1}`;

    imageOption.appendChild(img);
    imageOption.addEventListener('click', () => selectImage(imageUrl, imageOption));

    imageGallery.appendChild(imageOption);
  });
}

/**
 * Handle image selection
 */
function selectImage(imageUrl, element) {
  selectedImageUrl = imageUrl;

  // Update UI
  document.querySelectorAll('.image-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  element.classList.add('selected');
}

/**
 * Handle print button (form submit)
 * Opens print page with product data
 */
function handlePrint(e) {
  e.preventDefault();

  // Collect data from form
  const printData = {
    title_short: form.titleShort.value,
    price: form.price.value,
    quantity_unit: form.quantityUnit.value,
    supplier: form.supplier.value,
    product_url: form.productUrl.value, // Use editable URL from form
    reorder_level: form.reorderLevel.value,
    order_quantity: form.orderQuantity.value,
    notes: form.notes.value,
    image_url: selectedImageUrl || currentProductData?.image_url || ''
  };

  // Store data in session storage for print page
  chrome.storage.local.set({ printData }, () => {
    // Open print page in new tab
    chrome.tabs.create({ url: 'print.html' });
  });
}

/**
 * Show specific state and hide others
 */
function showState(stateName) {
  Object.keys(states).forEach(key => {
    states[key].classList.toggle('hidden', key !== stateName);
  });
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  showState('error');
}

/**
 * Update preview (placeholder for future enhancements)
 */
function updatePreview() {
  // Could show live preview of card layout here
}

/**
 * Check URL length and highlight if too long
 */
function checkUrlLength() {
  const url = form.productUrl.value;
  const MAX_RECOMMENDED_LENGTH = 50;
  const warningElement = document.getElementById('urlLengthWarning');

  if (url.length > MAX_RECOMMENDED_LENGTH) {
    form.productUrl.classList.add('url-too-long');
    if (warningElement) {
      warningElement.classList.remove('hidden');
    }
  } else {
    form.productUrl.classList.remove('url-too-long');
    if (warningElement) {
      warningElement.classList.add('hidden');
    }
  }
}
