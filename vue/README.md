# Codem Phone — Counter Example (Vue 3 + Vite)

Vue 3 ile yazılmış custom phone app. Vite tabanlı build setup'ı sayesinde
modern dev workflow (HMR, SFC, scoped styles) ile geliştirir,
`vite-plugin-singlefile` ile tek dosya bundle'a derlenir → `ui/index.html`.

## Yapı

```
[vue]/
├── fxmanifest.lua          # FiveM resource manifest
├── client/main.lua         # AddCustomApp ile telefona kayıt
├── server/main.lua         # Counter callback'leri
├── ui/
│   ├── index.html          # ◀ Build çıktısı (FiveM bunu okur)
│   └── icon.svg
├── src/                    # ◀ Vite projesi (build buradan çalışır)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── main.js             # createApp + mount
│   ├── App.vue             # SFC
│   ├── mphone.js           # codem-phone iframe köprüsü (reusable)
│   └── style.css           # Global stiller
└── README.md
```

## Geliştirme

```bash
cd src
npm install
npm run dev      # Vite dev server + HMR (http://localhost:5173)
npm run build    # ../ui/index.html üretir → FiveM bunu kullanır
```

Dev server'da `mphone:init` gerçek telefon olmadığı için tetiklenmez; standalone
test etmek istersen `src/main.js` içinde mock init çağrısı ekleyebilirsin.

## Sunucuda çalıştırma

1. `cd src && npm install && npm run build` çalıştır → `ui/index.html` oluşur
2. `server.cfg`'ye ekle:
   ```cfg
   ensure codem-phone
   ensure [vue]
   ```
3. Telefonu açtığında **Counter (Vue)** ikonu görünür

## Anahtar Kavramlar

- **`src/mphone.js`** — `sendCallback`, `onInit`, `notify`, `close`, `setWaypoint`
  helper'ları. Tüm custom app'lerde aynı API; framework değişse de aynı kalır.
- **Identifier**: `example-counter-vue` — diğer örneklerle çakışmaz.
- **Server event format**: `codem-phone:customApp:example-counter-vue:{action}`
- **Bundle**: `vite-plugin-singlefile` JS + CSS + assets'i index.html'e inline'lar
  → iframe srcdoc'tan tek bir self-contained payload olarak çalışır.

## Customize

`src/App.vue` ve `src/style.css`'te değişiklik yap → `cd src && npm run build` →
telefon resource'unu restart et.
