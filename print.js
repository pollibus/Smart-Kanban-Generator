// Print page script
// Loads product data and generates printable Kanban cards

let printData = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  await initI18n();

  // Translate UI elements
  document.getElementById('printBtn').textContent = t('print.printBtn');
  document.getElementById('closeBtn').textContent = t('print.closeBtn');
  document.querySelector('.hint').textContent = t('print.hint');

  // Load data from storage
  const result = await chrome.storage.local.get(['printData']);
  printData = result.printData;

  if (!printData) {
    alert(t('errors.noData') || 'No data found. Please start the process again.');
    window.close();
    return;
  }

  // Generate cards
  generateCards();

  // Setup buttons
  document.getElementById('printBtn').addEventListener('click', () => window.print());
  document.getElementById('closeBtn').addEventListener('click', () => window.close());
});

/**
 * Generate all card sizes on one page
 * User can cut out the size that fits best
 */
function generateCards() {
  const container = document.getElementById('printContainer');

  // Generate all 4 card sizes
  const cardSizes = ['large', 'medium', 'small', 'small']; // 2 small cards for space efficiency

  cardSizes.forEach(size => {
    const templateId = `cardTemplate${capitalize(size)}`;
    const template = document.getElementById(templateId);

    if (!template) {
      console.error('Template not found:', templateId);
      return;
    }

    // Clone template
    const card = template.content.cloneNode(true);

    // Populate card data
    populateCard(card, printData);

    // Add to container
    container.appendChild(card);
  });

  // Generate QR codes after all cards are in DOM
  setTimeout(() => {
    const qrContainers = container.querySelectorAll('.card-qr');
    qrContainers.forEach(qrContainer => {
      generateQRCode(qrContainer, printData.product_url);
    });
  }, 100);
}

/**
 * Populate card with product data
 */
function populateCard(card, data) {
  // Title
  const title = card.querySelector('.card-title');
  if (title) title.textContent = data.title_short || 'Product Title';

  // Price
  const price = card.querySelector('.price');
  if (price) price.textContent = data.price || '';

  // Quantity
  const quantity = card.querySelector('.quantity');
  if (quantity) quantity.textContent = data.quantity_unit || '';

  // Supplier
  const supplier = card.querySelector('.supplier');
  if (supplier) supplier.textContent = data.supplier || '';

  // Reorder level
  const reorder = card.querySelector('.reorder');
  if (reorder) reorder.textContent = data.reorder_level || '1 package';

  // Order quantity
  const order = card.querySelector('.order');
  if (order) order.textContent = data.order_quantity || '1 package';

  // Notes
  const notes = card.querySelector('.notes');
  if (notes) {
    if (data.notes && data.notes.trim()) {
      notes.textContent = data.notes;
    } else {
      notes.textContent = '—';
    }
  }

  // Translate labels
  const labels = card.querySelectorAll('.label');
  labels.forEach(label => {
    const text = label.textContent.trim();
    if (text.includes('Preis') || text.includes('Price')) {
      label.textContent = t('print.cardLabels.price');
    } else if (text.includes('Menge') || text.includes('Quantity')) {
      label.textContent = t('print.cardLabels.quantity');
    } else if (text.includes('Lieferant') || text.includes('Supplier')) {
      label.textContent = t('print.cardLabels.supplier');
    } else if (text.includes('Sicherheitsbestand') || text.includes('Safety Stock')) {
      label.textContent = t('print.cardLabels.safetyStock');
    } else if (text.includes('Bestellmenge') || text.includes('Order Quantity')) {
      label.textContent = t('print.cardLabels.orderQuantity');
    } else if (text.includes('Notizen') || text.includes('Notes')) {
      label.textContent = t('print.cardLabels.notes');
    }
  });

  // Translate footer labels
  const footerLabels = card.querySelectorAll('.footer-label');
  footerLabels.forEach(label => {
    const text = label.textContent.trim();
    if (text.includes('Min')) {
      label.textContent = t('print.cardLabels.min');
    } else if (text.includes('Bestell') || text.includes('Order')) {
      label.textContent = t('print.cardLabels.order');
    }
  });

  // Image
  const image = card.querySelector('.card-image') || card.querySelector('.card-image-a4');
  if (image && data.image_url) {
    image.src = data.image_url;
    // Add crossorigin attribute to help with CORS
    image.crossOrigin = 'anonymous';
    // Add error handler to hide broken images
    image.onerror = function() {
      this.style.display = 'none';
    };
  } else if (image) {
    image.style.display = 'none';
  }
}

/**
 * Generate QR code for product URL
 */
function generateQRCode(container, url) {
  if (!container || !url) {
    console.warn('Cannot generate QR code: missing container or URL');
    return;
  }

  // Check if QRCode library is available
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded');
    container.innerHTML = '<p style="font-size: 8pt; text-align: center; color: #999;">QR-Code nicht verfügbar</p>';
    return;
  }

  // Clear container
  container.innerHTML = '';

  try {
    // Generate QR code
    new QRCode(container, {
      text: url,
      width: container.offsetWidth || 128,
      height: container.offsetHeight || 128,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (e) {
    console.error('QR Code generation failed:', e);
    container.innerHTML = '<p style="font-size: 8pt; text-align: center; color: #999;">QR-Code Fehler</p>';
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
