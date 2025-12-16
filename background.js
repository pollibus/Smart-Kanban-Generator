// Background Service Worker for API communication
// Handles OpenAI API calls for product data normalization

console.log('[Smart Kanban] Background service worker loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'normalizeProductData') {
    console.log('[Smart Kanban] Normalizing product data via OpenAI...');
    normalizeWithOpenAI(request.data)
      .then(normalized => {
        console.log('[Smart Kanban] Normalization successful:', normalized);
        sendResponse({ success: true, data: normalized });
      })
      .catch(error => {
        console.error('[Smart Kanban] Normalization failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  if (request.action === 'contentScriptReady') {
    console.log('[Smart Kanban] Content script ready');
  }
});

/**
 * Normalize product data using OpenAI API
 * @param {Object} rawData - Raw extracted product data
 * @returns {Promise<Object>} - Normalized product data
 */
async function normalizeWithOpenAI(rawData) {
  // Get API key from storage
  const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);

  if (!openaiApiKey) {
    throw new Error('OpenAI API Key nicht konfiguriert. Bitte in den Einstellungen hinterlegen.');
  }

  // Build prompt for OpenAI
  const prompt = buildNormalizationPrompt(rawData);

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du bist ein Assistent zur Normalisierung von Produktdaten für Kanban-Karten.

Deine Aufgabe:
- Extrahiere und normalisiere Produktinformationen aus den gegebenen Rohdaten
- Erstelle einen kurzen, prägnanten Titel (z.B. "Miele Spülmittel-Tabs, 16 Stück, 14,99 €")
- Normalisiere Preise im Format "XX.XX €"
- Normalisiere Mengen (z.B. "500g", "1L", "16 Stück")
- Schlage sinnvolle Werte für Sicherheitsbestand (reorder_level) und Bestellmenge (order_quantity) vor
- Standard-Regel: 1 Packung Sicherheitsbestand, 1 Packung Bestellmenge
- Kürze die Produkt-URL intelligent:
  * Entferne Tracking-Parameter (utm_*, ref, tag, fbclid, gclid, mc_*, _ga, etc.)
  * Behalte nur essenzielle Parameter für Produktidentifikation
  * Beispiel: amazon.de/dp/B0ABCDEF?tag=xyz&ref=123 → amazon.de/dp/B0ABCDEF
  * Bei Unsicherheit: Entferne alles nach "?"
- Lasse Felder leer, wenn Daten nicht eindeutig extrahierbar sind

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein zusätzlicher Text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for deterministic output
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Keine Antwort von OpenAI erhalten');
  }

  try {
    const normalized = JSON.parse(content);
    return validateAndCleanResponse(normalized, rawData);
  } catch (e) {
    throw new Error('Ungültige JSON-Antwort von OpenAI: ' + e.message);
  }
}

/**
 * Build normalization prompt from raw data
 */
function buildNormalizationPrompt(rawData) {
  return `Normalisiere folgende Produktdaten zu einer Kanban-Karte:

Rohdaten:
- Titel: ${rawData.title || 'N/A'}
- Preis: ${rawData.price || 'N/A'}
- Menge/Einheit: ${rawData.quantity || 'N/A'}
- Anbieter/Marke: ${rawData.supplier || 'N/A'}
- Bild-URL: ${rawData.image_url || 'N/A'}
- Produkt-URL: ${rawData.product_url || 'N/A'}
- Domain: ${rawData.domain || 'N/A'}

Erwartetes JSON-Schema:
{
  "title_short": "Kurzer, prägnanter Titel (max. 60 Zeichen)",
  "price": "Normalisierter Preis im Format 'XX.XX €'",
  "quantity_unit": "Normalisierte Mengenangabe (z.B. '500g', '1L', '16 Stück')",
  "supplier": "Hersteller/Marke",
  "image_url": "Original Bild-URL (unverändert übernehmen)",
  "product_url": "GEKÜRZTE Produkt-URL ohne Tracking-Parameter",
  "reorder_level": "Sicherheitsbestand als Text (z.B. '1 Packung', '2 Stück')",
  "order_quantity": "Bestellmenge als Text (z.B. '1 Packung', '3 Stück')",
  "notes": "Optionale Notizen oder leerer String"
}

Wichtig:
- title_short: Kombiniere Marke, Produkt und Menge sinnvoll (z.B. "Ariel Waschmittel Color, 100 Waschgänge, 29,99 €")
- Bei unklaren Daten: Feld leer lassen ("")
- reorder_level und order_quantity: Verwende als Standard "1 Packung", wenn nichts anderes sinnvoll ist
- product_url: Entferne Tracking-Parameter für kompakteren QR-Code
- image_url: Unverändert übernehmen
`;
}

/**
 * Validate and clean OpenAI response
 * Ensures all required fields exist and adds fallbacks
 */
function validateAndCleanResponse(normalized, rawData) {
  const cleaned = {
    title_short: normalized.title_short || rawData.title || '',
    price: normalized.price || rawData.price || '',
    quantity_unit: normalized.quantity_unit || rawData.quantity || '',
    supplier: normalized.supplier || rawData.supplier || '',
    image_url: normalized.image_url || rawData.image_url || '',
    product_url: normalized.product_url || rawData.product_url || '',
    reorder_level: normalized.reorder_level || '1 Packung',
    order_quantity: normalized.order_quantity || '1 Packung',
    notes: normalized.notes || ''
  };

  return cleaned;
}

/**
 * Test API key validity
 */
async function testApiKey(apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return response.ok;
  } catch (e) {
    return false;
  }
}

// Export for use in options page
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testApiKey };
}
