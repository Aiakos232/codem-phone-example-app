# Codem Phone — Counter Example (React + TypeScript + Vite)

React 18 + TypeScript + Vite ile yazılmış custom phone app. Tip-güvenli mphone
köprüsü (`PlayerInfo`, `CallbackResult<T>` gibi tipler) ve `tsc -b` ile build
öncesi tip kontrolü.

## Yapı

```
[reactts]/
├── fxmanifest.lua
├── client/main.lua         # AddCustomApp ile telefona kayıt
├── server/main.lua         # Counter callback'leri
├── ui/
│   ├── index.html          # ◀ Build çıktısı (FiveM bunu okur)
│   └── icon.svg
├── src/                    # ◀ Vite projesi (build buradan çalışır)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── main.tsx            # createRoot
│   ├── App.tsx             # Tipli React functional component
│   ├── mphone.ts           # Tipli iframe köprüsü (reusable)
│   └── style.css
└── README.md
```

## Geliştirme

```bash
cd src
npm install
npm run dev          # Vite dev server + HMR + TS hot-checking
npm run typecheck    # tsc --noEmit (CI'da kullan)
npm run build        # tsc -b → vite build → ../ui/index.html
```

## Sunucuda çalıştırma

1. `cd src && npm install && npm run build`
2. `server.cfg`:
   ```cfg
   ensure codem-phone
   ensure [reactts]
   ```
3. Telefonu açtığında **Counter (React TS)** ikonu görünür

## TypeScript Highlights

`src/mphone.ts` tüm protokolü tipler:

```ts
export interface PlayerInfo {
    phoneNumber?: string;
    identifier?: string;
    name?: string;
}

export function sendCallback<T = unknown>(
    action: string,
    payload?: object,
    toServer?: boolean
): Promise<CallbackResult<T>>;
```

Generic ile beklenen response tipini söyleyebilirsin:

```ts
const r = await sendCallback<{ count: number }>("getCounter");
//        ^ CallbackResult<{ count: number }>
```

## Anahtar Kavramlar

- **Identifier**: `example-counter-react-ts`
- **Server event format**: `codem-phone:customApp:example-counter-react-ts:{action}`
- Build: `tsc -b` tip kontrolü sonrası `vite build` (CI/CD'de hatalı tip
  build'i kırar).

## Customize

`src/App.tsx` ve `src/style.css`'te değişiklik yap → `cd src && npm run build` →
resource'u restart et.
