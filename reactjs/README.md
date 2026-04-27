# Codem Phone — Counter Example (React + Vite)

React 18 + Vite ile yazılmış custom phone app. JSX, hooks ve modern dev workflow.
`vite-plugin-singlefile` çıktıyı tek bir self-contained `ui/index.html`'e bundle'lar.

## Yapı

```
[reactjs]/
├── fxmanifest.lua
├── client/main.lua         # AddCustomApp ile telefona kayıt
├── server/main.lua         # Counter callback'leri
├── ui/
│   ├── index.html          # ◀ Build çıktısı (FiveM bunu okur)
│   └── icon.svg
├── src/                    # ◀ Vite projesi (build buradan çalışır)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── main.jsx            # createRoot
│   ├── App.jsx             # React functional component + hooks
│   ├── mphone.js           # codem-phone iframe köprüsü (reusable)
│   └── style.css
└── README.md
```

## Geliştirme

```bash
cd src
npm install
npm run dev      # Vite dev server + HMR
npm run build    # ../ui/index.html üretir
```

## Sunucuda çalıştırma

1. `cd src && npm install && npm run build`
2. `server.cfg`:
   ```cfg
   ensure codem-phone
   ensure [reactjs]
   ```
3. Telefonu açtığında **Counter (React)** ikonu görünür

## Anahtar Kavramlar

- **Hooks**: `useState`, `useEffect`, `useCallback` ile state ve side effect.
- **`src/mphone.js`** — `sendCallback`, `onInit`, `notify`, `close` helper'ları.
- **Identifier**: `example-counter-react`
- **Server event format**: `codem-phone:customApp:example-counter-react:{action}`

## Customize

`src/App.jsx` ve `src/style.css`'te değişiklik yap → `cd src && npm run build` →
resource'u restart et.
