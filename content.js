// Content Script for DOM extraction
// Extracts product information from e-commerce product detail pages

console.log('[Smart Kanban] Content script loaded');

// Listen for extraction requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProductData') {
    console.log('[Smart Kanban] Starting product data extraction...');

    const productData = extractProductInformation();

    console.log('[Smart Kanban] Extracted data:', productData);
    sendResponse({ success: true, data: productData });
  }

  return true; // Keep message channel open for async response
});

/**
 * Main extraction function
 * Tries multiple selectors to find product information
 */
function extractProductInformation() {
  const data = {
    title: extractTitle(),
    price: extractPrice(),
    images: extractAllImages(), // Array of all found images
    image_url: extractImage(),   // Best guess (for backwards compatibility)
    quantity: extractQuantity(),
    supplier: extractSupplier(),
    product_url: shortenUrl(window.location.href),
    domain: window.location.hostname,
    extracted_at: new Date().toISOString()
  };

  return data;
}

/**
 * Shorten URLs for cleaner QR codes
 * Currently handles Amazon URLs by removing tracking parameters
 * @param {string} url - Full product URL
 * @returns {string} - Shortened URL
 */
function shortenUrl(url) {
  try {
    const urlObj = new URL(url);

    // Amazon URL shortening: https://www.amazon.{domain}/dp/{ASIN}/
    if (urlObj.hostname.includes('amazon.')) {
      // Extract ASIN from path (format: /dp/ASIN/ or /gp/product/ASIN/)
      const dpMatch = urlObj.pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (dpMatch) {
        const asin = dpMatch[2];
        return `${urlObj.protocol}//${urlObj.hostname}/dp/${asin}/`;
      }
    }

    // For other sites, return original URL
    return url;
  } catch (e) {
    // Invalid URL, return as-is
    return url;
  }
}

/**
 * Extract product title
 * Common selectors for Amazon, eBay, and generic e-commerce sites
 */
function extractTitle() {
  const selectors = [
    // Amazon
    '#productTitle',
    'h1#title',
    'span#productTitle',
    // Generic e-commerce
    'h1[itemprop="name"]',
    'h1.product-title',
    'h1.product-name',
    '.product-detail-title h1',
    '[data-testid="product-title"]',
    'meta[property="og:title"]',
    // eBay
    'h1.x-item-title__mainTitle',
    // Shopify
    '.product-single__title',
    'h1.product__title',
    // WooCommerce
    'h1.product_title',
    // Fallback
    'h1'
  ];

  const title = findTextBySelectors(selectors);
  return title ? title.trim() : '';
}

/**
 * Extract price
 * Handles various price formats and currencies
 */
function extractPrice() {
  const selectors = [
    // Amazon
    '.a-price .a-offscreen',
    'span.a-price-whole',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price-range .a-offscreen',
    // Generic structured data
    '[itemprop="price"]',
    'meta[property="product:price:amount"]',
    // Generic class-based
    '.price',
    '.product-price',
    '.current-price',
    '.sale-price',
    '.final-price',
    'span.price',
    'div.price',
    'p.price',
    '[data-testid="product-price"]',
    '[data-test="product-price"]',
    // Shop Apotheke & Pharmacy sites
    '.price-box .price',
    '.product-info-price .price',
    '.price-final',
    '.regular-price',
    '.special-price',
    // eBay
    '.x-price-primary',
    '.x-bin-price__content',
    // Shopify
    '.price--main',
    '.product__price',
    '.product-price__price',
    // WooCommerce
    '.woocommerce-Price-amount',
    'p.price ins .amount',
    '.amount',
    // More generic fallbacks
    '[class*="price"]',
    '[id*="price"]'
  ];

  const priceText = findTextBySelectors(selectors);

  // If still not found, try to find any element containing currency symbols
  if (!priceText) {
    const currencyPattern = /€|EUR|\$|USD|£|GBP/;
    const allElements = document.querySelectorAll('span, div, p');
    for (const el of allElements) {
      const text = el.textContent || '';
      if (currencyPattern.test(text) && text.length < 30) {
        const cleaned = cleanPrice(text);
        if (cleaned && cleaned.match(/\d/)) {
          return cleaned;
        }
      }
    }
  }

  return priceText ? cleanPrice(priceText) : '';
}

/**
 * Extract all product images for user selection
 * Returns array of image URLs
 */
function extractAllImages() {
  const images = new Set(); // Use Set to avoid duplicates
  const minSize = 200; // Minimum image size in pixels (increased to filter out small icons)

  // Primary product image selectors
  const selectors = [
    // Amazon
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    'img.a-dynamic-image',
    // Generic
    '[itemprop="image"]',
    '.product-image img',
    '.product-gallery img',
    '.product-images img',
    '[data-testid="product-image"]',
    '.product-detail-image img',
    '.product-photo img',
    // Shop Apotheke
    '.gallery-image img',
    '.product-image-gallery img',
    '.image-gallery img',
    // eBay
    '.ux-image-carousel-item img',
    // Shopify
    '.product__main-photos img',
    // WooCommerce
    '.woocommerce-product-gallery__image img',
    // Fallback: any image in main content area
    'main img',
    'article img',
    '.main-content img'
  ];

  // Extract from specific selectors
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(img => {
      if (img.tagName === 'IMG' && isValidProductImage(img)) {
        const src = img.currentSrc || img.src;
        if (src && !src.includes('data:image') && !src.includes('placeholder')) {
          // Check image size
          if (img.naturalWidth >= minSize && img.naturalHeight >= minSize) {
            images.add(src);
          }
        }
      }
    });
  });

  // Also check meta tags
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const ogImageUrl = ogImage.getAttribute('content');
    if (ogImageUrl && !isLogoUrl(ogImageUrl)) {
      images.add(ogImageUrl);
    }
  }

  // Convert Set to Array and limit to first 8 images
  return Array.from(images).slice(0, 8);
}

/**
 * Check if an image is a valid product image (not logo, icon, etc.)
 * @param {HTMLImageElement} img - The image element to check
 * @returns {boolean} - True if likely a product image
 */
function isValidProductImage(img) {
  const src = img.currentSrc || img.src || '';
  const alt = img.alt || '';
  const className = img.className || '';
  const id = img.id || '';

  // Filter out logos
  if (isLogoUrl(src) || isLogoUrl(alt) || isLogoUrl(className) || isLogoUrl(id)) {
    return false;
  }

  // Filter out very wide images (likely banners)
  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    if (aspectRatio > 4 || aspectRatio < 0.25) {
      return false; // Too wide or too tall, likely banner or decorative
    }
  }

  return true;
}

/**
 * Check if a string contains logo-related keywords
 * @param {string} str - String to check
 * @returns {boolean} - True if contains logo keywords
 */
function isLogoUrl(str) {
  if (!str) return false;
  const lowerStr = str.toLowerCase();
  const logoKeywords = [
    'logo',
    'brand-logo',
    'site-logo',
    'header-logo',
    'footer-logo',
    'icon',
    'favicon',
    'sprite',
    'banner',
    'badge',
    'seal',
    'trust',
    'payment',
    'shipping',
    'delivery'
  ];
  return logoKeywords.some(keyword => lowerStr.includes(keyword));
}

/**
 * Extract main product image URL
 * Returns the actual loaded image, not lazy-load placeholders
 */
function extractImage() {
  const selectors = [
    // Amazon
    '#landingImage',
    '#imgBlkFront',
    '#main-image',
    'img.a-dynamic-image',
    // Generic
    '[itemprop="image"]',
    '.product-image img',
    '.product-gallery img:first-of-type',
    '[data-testid="product-image"]',
    'meta[property="og:image"]',
    // eBay
    '.ux-image-carousel-item img',
    // Shopify
    '.product__main-photos img',
    // WooCommerce
    '.woocommerce-product-gallery__image img'
  ];

  // Try img elements first
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'IMG') {
        // Get actual src, not data-src or lazy-load placeholders
        const src = element.currentSrc || element.src;
        if (src && !src.includes('data:image') && !src.includes('placeholder')) {
          return src;
        }
      } else if (element.tagName === 'META') {
        return element.getAttribute('content') || '';
      }
    }
  }

  return '';
}

/**
 * Extract quantity/unit information
 * Examples: "500g", "1 Liter", "16 Stück"
 */
function extractQuantity() {
  const selectors = [
    // Amazon
    '#variation_size_name .selection',
    '#quantity',
    'span.a-size-medium.a-color-base:contains("Größe")',
    // Generic
    '[itemprop="weight"]',
    '.product-quantity',
    '.product-size',
    '[data-testid="product-quantity"]',
    // Try to find in title or description
    '.a-spacing-mini .a-size-base'
  ];

  const quantityText = findTextBySelectors(selectors);

  // If not found in specific fields, try to extract from title
  if (!quantityText) {
    const title = extractTitle();
    const quantityMatch = title.match(/(\d+[\.,]?\d*\s*(g|kg|ml|l|stück|stuck|pieces|pcs|count))/i);
    return quantityMatch ? quantityMatch[0] : '';
  }

  return quantityText ? quantityText.trim() : '';
}

/**
 * Extract supplier/brand/manufacturer
 */
function extractSupplier() {
  const selectors = [
    // Amazon
    '#bylineInfo',
    'a#bylineInfo',
    '.po-brand .po-break-word',
    '#brand',
    // Generic
    '[itemprop="brand"]',
    '.product-brand',
    '.brand-name',
    '[data-testid="product-brand"]',
    'meta[property="product:brand"]',
    // eBay
    '.ux-labels-values__labels:-soup-contains("Marke") + .ux-labels-values__values',
    // Shopify
    '.product__vendor',
    // WooCommerce
    '.posted_in a'
  ];

  const supplier = findTextBySelectors(selectors);

  // Clean up "von " or "by " prefix common in Amazon
  if (supplier) {
    return supplier.replace(/^(von|by|Marke:)\s*/i, '').trim();
  }

  // Fallback: Use domain name
  return window.location.hostname.replace('www.', '');
}

/**
 * Helper: Find text content from list of selectors
 * Returns first non-empty match
 */
function findTextBySelectors(selectors) {
  for (const selector of selectors) {
    try {
      // Handle meta tags
      if (selector.startsWith('meta[')) {
        const meta = document.querySelector(selector);
        if (meta) {
          const content = meta.getAttribute('content');
          if (content && content.trim()) {
            return content.trim();
          }
        }
        continue;
      }

      // Regular elements
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent || element.innerText || '';
        if (text.trim()) {
          return text.trim();
        }
      }
    } catch (e) {
      // Invalid selector, continue
      continue;
    }
  }

  return '';
}

/**
 * Clean price text
 * Removes currency symbols and normalizes format
 */
function cleanPrice(priceText) {
  if (!priceText) return '';

  // Remove extra whitespace and newlines
  priceText = priceText.replace(/\s+/g, ' ').trim();

  // Extract number with decimal point/comma
  // Matches formats like: 14,99 or 1.299,99 or 1,299.99 or 14.99
  const match = priceText.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/);
  if (match) {
    let price = match[1];

    // Determine if comma or dot is decimal separator
    // If there's a comma followed by exactly 2 digits, it's likely the decimal separator
    // If there's a dot followed by exactly 2 digits at the end, it's likely the decimal separator
    if (price.match(/,\d{2}$/)) {
      // German/European format: 1.299,99
      price = price
        .replace(/\./g, '')  // Remove thousand separators (dots)
        .replace(',', '.');  // Replace decimal comma with dot
    } else if (price.match(/\.\d{2}$/)) {
      // US/UK format: 1,299.99
      price = price.replace(/,/g, '');  // Remove thousand separators (commas)
    } else {
      // Unclear format, assume European (more common)
      price = price
        .replace(/\s/g, '')  // Remove spaces
        .replace(/\./g, '')  // Remove dots (thousand separators)
        .replace(',', '.');  // Replace comma with dot
    }

    // Add currency if present
    const currency = priceText.match(/[€$£¥]/);
    if (currency) {
      price += ' ' + currency[0];
    } else if (priceText.match(/EUR/i)) {
      price += ' €';
    } else if (priceText.match(/USD/i)) {
      price += ' $';
    } else if (priceText.match(/GBP/i)) {
      price += ' £';
    }

    return price;
  }

  return priceText.trim();
}

// Notify that content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' });
