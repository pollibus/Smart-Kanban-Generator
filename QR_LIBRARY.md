# QR Code Library Setup

Die Extension benötigt die QRCode.js Bibliothek für die Generierung von QR-Codes.

## Option 1: Download von CDN (Empfohlen)

1. Gehe zu: https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
2. Speichere die Datei als `qrcode.min.js` im Projektverzeichnis

## Option 2: Von GitHub

1. Besuche: https://github.com/davidshimjs/qrcodejs
2. Download: https://raw.githubusercontent.com/davidshimjs/qrcodejs/master/qrcode.min.js
3. Speichere als `qrcode.min.js` im Projektverzeichnis

## Option 3: Mit curl (Terminal)

```bash
cd Smart-Kanban-Generator
curl -O https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
```

## Verifizierung

Die Datei `qrcode.min.js` sollte etwa 23 KB groß sein.

Nach dem Download sollte die Projektstruktur so aussehen:

```
Smart-Kanban-Generator/
├── qrcode.min.js  ← Diese Datei
├── manifest.json
├── content.js
├── background.js
├── popup.html
├── print.html
└── ...
```

## Alternative: Inline QR Code Generator

Falls du die externe Bibliothek nicht verwenden möchtest, kann auch eine einfache, selbst geschriebene QR-Code-Generierung eingebaut werden. Allerdings ist qrcodejs ausgereifter und besser getestet.
