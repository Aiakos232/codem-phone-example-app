# Codem Phone — Custom App Example (React + TypeScript + Vite)

A complete reference implementation of a custom app for **codem-phone**, built with **React 18 + TypeScript + Vite**. Type-safe `mphone.ts` bridge (`PlayerInfo`, `CallbackResult<T>` and friends), `tsc -b` type-checking before every build, and a Vite plugin that inlines the entire bundle into one self-contained `ui/index.html`.

## Table of Contents

- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Production Build](#production-build)
- [How It Works](#how-it-works)
- [The mphone.ts Helper](#the-mphonets-helper)
- [TypeScript Tips](#typescript-tips)
- [AddCustomApp Reference](#addcustomapp-reference)
- [codem-phone Exports](#codem-phone-exports)
- [Server-Side Callbacks](#server-side-callbacks)
- [mphone Protocol](#mphone-protocol)
- [App Store Integration](#app-store-integration)
- [Job Restrictions](#job-restrictions)
- [Important: Resource Naming](#important-resource-naming)
- [Troubleshooting](#troubleshooting)

## Requirements

| Tool | Version | Description |
|------|---------|-------------|
| `codem-phone` | latest | Main phone resource (required dependency) |
| FiveM Server | `cerulean`+ | Required `fx_version` |
| Node.js | 18+ | For Vite build tooling |
| TypeScript | 5+ | Bundled via `devDependencies` |
| npm / pnpm / yarn | any | Package manager (examples below use npm) |

## Project Structure

```
reactts/
├── fxmanifest.lua             # Resource manifest
├── client/
│   └── main.lua               # AddCustomApp registration + lifecycle
├── server/
│   └── main.lua               # Counter callback handlers
├── ui/
│   ├── index.html             # ◄ Build output — FiveM reads this
│   └── icon.svg               # App icon (home screen + notifications)
├── src/                       # ◄ Vite project — build entry point
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html             # Vite entry HTML (NOT the FiveM-loaded one)
│   ├── main.tsx               # createRoot
│   ├── App.tsx                # Root component (typed functional + hooks)
│   ├── mphone.ts              # Typed codem-phone iframe bridge (reusable)
│   └── style.css              # Global styles
└── README.md
```

`src/index.html` is the **Vite source**. `vite-plugin-singlefile` inlines all assets into one self-contained file and outputs it to `../ui/index.html`. The FiveM resource only loads from `ui/index.html`.

## Installation

1. Copy this folder into your `resources/` directory.
2. Build the UI at least once before starting the resource:

   ```bash
   cd src
   npm install
   npm run build
   ```

   `npm run build` runs `tsc -b` first (type-check) and then `vite build`. A type error fails the build before any output is written.

3. Add to `server.cfg` **after** `codem-phone`:

   ```cfg
   ensure codem-phone
   ensure reactts
   ```

   Replace `reactts` with your actual folder name. The Lua client uses `GetCurrentResourceName()`, so renaming the folder doesn't break the icon URL.

4. Restart the server. Open the phone in-game — **Counter (React TS)** appears on the home grid.

## Development Workflow

```bash
cd src
npm run dev          # Vite dev server with HMR + TS hot-checking
npm run typecheck    # tsc --noEmit (use this in CI)
npm run watch        # Rebuild ../ui/index.html on every save
```

The dev server has no phone parent, so `mphone:init` never arrives. See [Mocking init during dev](#mocking-init-during-dev) for a fix.

For in-game testing, `npm run watch` rebuilds on every save; then `restart reactts` (or your actual resource name) to pick up the new bundle.

### Mocking init during dev

```tsx
// src/main.tsx
if (import.meta.env.DEV) {
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent("message", {
            data: {
                type: "mphone:init",
                player: { phoneNumber: "555-DEV", name: "Dev Player" } as const,
                theme: "dark",
                language: "en",
            },
        }));
    }, 100);
}
```

## Production Build

```bash
cd src
npm run build        # tsc -b → vite build → ../ui/index.html
```

Type errors abort the build. `vite-plugin-singlefile` inlines JS, CSS, and assets into one file. The build leaves `ui/icon.svg` untouched (`emptyOutDir: false`).

After the build completes:

```
restart reactts
```

## How It Works

Custom apps run inside an isolated `<iframe>` with sandbox `allow-scripts allow-forms allow-popups`. They can't access FiveM natives — instead they communicate with the phone via `window.postMessage` (the `mphone:*` protocol).

```
┌──────────────────────────┐   postMessage   ┌──────────────────────┐
│ ui/index.html (iframe)   │ ◄─────────────► │  codem-phone NUI     │
│ (React + TS, single file)│                 └──────────┬───────────┘
└──────────────────────────┘                            │ NUI callback
                                                        ▼
                                            ┌──────────────────────┐
                                            │  client/main.lua     │
                                            └──────────┬───────────┘
                                                       │ TriggerEvent
                                                       ▼
                                            ┌──────────────────────┐
                                            │  server/main.lua     │
                                            └──────────────────────┘
```

Lifecycle:

1. `codem-phone` fires `codem-phone:phoneLoaded`.
2. `client/main.lua` reads `ui/index.html` from the resource and calls `AddCustomApp`.
3. The phone NUI receives the registration and renders the icon.
4. When the user opens the app, the iframe loads with `srcdoc=<your html>` and the phone posts `mphone:init`.
5. Your React app calls `sendCallback<T>(...)` from `mphone.ts` to invoke server/client handlers — fully typed.

## The mphone.ts Helper

`src/mphone.ts` types the entire postMessage protocol.

```ts
export interface PlayerInfo {
    phoneNumber?: string;
    identifier?: string;
    name?: string;
    serverId?: number;
}

export interface CallbackResult<T = unknown> {
    success: boolean;
    error?: string;
    [key: string]: unknown;
    data?: T;
}

export function sendCallback<T = unknown>(
    action: string,
    payload?: object,
    toServer?: boolean
): Promise<CallbackResult<T>>;

export function onInit(cb: (player: PlayerInfo) => void): void;
export function notify(header: string, message: string): void;
export function close(): void;
export function setWaypoint(x: number, y: number): void;
```

Usage with a generic to type the response:

```tsx
import { useEffect, useState } from "react";
import { sendCallback, onInit, notify, close, type PlayerInfo } from "./mphone";

interface CounterResponse {
    count: number;
}

function App() {
    const [count, setCount] = useState(0);
    const [player, setPlayer] = useState<PlayerInfo | null>(null);

    useEffect(() => {
        onInit(setPlayer);
    }, []);

    const increment = async () => {
        const res = await sendCallback<CounterResponse>("increment");
        if (res.success && typeof res.count === "number") {
            setCount(res.count);
        }
    };

    return (
        <div>
            <p>{player?.phoneNumber}</p>
            <button onClick={increment}>+ ({count})</button>
            <button onClick={() => notify("Counter", `Count is ${count}`)}>Notify</button>
            <button onClick={close}>Close</button>
        </div>
    );
}
```

| Function | Signature | Notes |
|----------|-----------|-------|
| `sendCallback<T>(action, payload, toServer = true)` | `Promise<CallbackResult<T>>` | 10s timeout; resolves with `{ success: false, error: "Timeout" }` if exceeded |
| `onInit(cb)` | `cb(player: PlayerInfo)` | Listens for every `mphone:init`; safe to call once in `useEffect` |
| `notify(header, message)` | `void` | Triggers the phone notification banner |
| `close()` | `void` | Returns to phone home |
| `setWaypoint(x, y)` | `void` | GTA world coordinates |

## TypeScript Tips

### Define your callback contracts

```ts
// src/types.ts
export interface IncrementPayload { /* empty for this example */ }
export interface IncrementResponse {
    count: number;
}

// usage:
const r = await sendCallback<IncrementResponse>("increment", {} as IncrementPayload);
if (r.success && r.count !== undefined) { ... }
```

### Type the broadcast channel

```tsx
type Broadcast =
    | { kind: "counter:reset" }
    | { kind: "counter:set"; value: number };

useEffect(() => {
    const handler = (e: MessageEvent) => {
        if (e.data?.type !== "broadcast") return;
        const msg = e.data.message as Broadcast;
        switch (msg.kind) {
            case "counter:reset": setCount(0); break;
            case "counter:set": setCount(msg.value); break;
        }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
}, []);
```

### Strict null-checking

`tsconfig.json` ships with `strict: true` enabled. Optional fields on `PlayerInfo` and `CallbackResult` use `?:` — narrow them with `if (res.success && res.count !== undefined)` rather than non-null assertions.

## AddCustomApp Reference

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter-react-ts',
    name       = 'Counter (React TS)',
    ui         = htmlContent,                                          -- contents of ui/index.html

    icon        = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'Counter example built with React + TypeScript + Vite',
    defaultApp  = false,
    notification = true,

    job = {
        ['police']    = { 3, 4 },
        ['ambulance'] = true,
    },

    onOpen  = function() print('opened')  end,
    onClose = function() print('closed') end,

    addAppStore = false,
    developer   = 'Your Name',
    headerImage = 'https://your-cdn/header.webp',
    swiperItems = { 'https://your-cdn/screenshot1.webp' },
})
```

Returns `success, err`.

| Option | Type | Required | Description |
|--------|------|:--------:|-------------|
| `identifier` | string | yes | Unique app id; used in event names and routing |
| `name` | string | yes | Display name on the home screen |
| `ui` | string | yes | Raw HTML loaded into the iframe via `srcdoc` |
| `icon` | string | no | NUI URL or absolute URL to the icon image |
| `description` | string | no | Short description (App Store + accessibility) |
| `defaultApp` | bool | no | Pre-installed (cannot be uninstalled) |
| `notification` | bool | no | Default `true`; allows notification banners |
| `job` | table | no | Job/grade visibility filter |
| `onOpen` | function | no | Fired when the user enters the app view |
| `onClose` | function | no | Fired when the user leaves the app view |
| `addAppStore` | bool | no | If `true`, app appears in App Store instead of home |
| `developer` | string | no | Developer line shown in App Store |
| `headerImage` | string | no | App Store detail page header image URL |
| `swiperItems` | string[] | no | App Store screenshot carousel images |

## codem-phone Exports

```lua
exports['codem-phone']:AddCustomApp(options)            -- → success, err
exports['codem-phone']:RemoveCustomApp(identifier)      -- → success, err
exports['codem-phone']:GetCustomApp(identifier)         -- → table | nil
exports['codem-phone']:SendCustomAppMessage(id, msg)    -- → success, err
exports['codem-phone']:IsPhoneOpen()                    -- → bool
```

`RemoveCustomApp` and `SendCustomAppMessage` only succeed when called from the same resource that registered the app.

`SendCustomAppMessage` reaches your React app as a `broadcast` event — see [Type the broadcast channel](#type-the-broadcast-channel) for a typed listener.

## Server-Side Callbacks

When the iframe calls `sendCallback(action, payload, true)`, the phone proxies it to a server-side event in this format:

```
codem-phone:customApp:{identifier}:{action}
```

```lua
-- server/main.lua
AddEventHandler('codem-phone:customApp:example-counter-react-ts:increment', function(source, payload, cb)
    local newValue = doSomething(source)
    cb({ success = true, count = newValue })
end)
```

The handler signature is `(source, payload, cb)` — call `cb(result)` to send the response back. Forgetting `cb` leaves the UI hanging until the 10s `sendCallback` timeout.

For client-side callbacks (`sendCallback(..., false)`), use `AddEventHandler` on the **client** with the same name format.

## mphone Protocol

### App → Host (your iframe sends these)

| Type | Payload | Purpose |
|------|---------|---------|
| `mphone:callback` | `{ action, payload, callbackId, server }` | Invoke server/client event handler |
| `mphone:notification` | `{ header, message }` | Show notification banner |
| `mphone:close` | — | Close the app (return to home) |
| `mphone:waypoint` | `{ x, y }` | Place a GPS waypoint in-game |
| `mphone:player` | `{ callbackId }` | Request fresh player info |

### Host → App (phone sends these to your iframe)

| Type | Payload | Purpose |
|------|---------|---------|
| `mphone:init` | `{ player, theme, language, identifier }` | Sent on every entry into the app |
| `mphone:callback:response` | `{ callbackId, result }` | Result of an `mphone:callback` |
| `mphone:player:response` | `{ callbackId, result }` | Result of an `mphone:player` request |
| `broadcast` | `{ message }` | Pushed via `SendCustomAppMessage` |

`mphone.ts` already handles `mphone:callback:response` plumbing — you only need to deal with `mphone:init` and `broadcast` directly.

## App Store Integration

Set `addAppStore = true` to publish into the App Store instead of installing onto the home screen.

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter-react-ts',
    name       = 'Counter (React TS)',
    ui         = htmlContent,
    icon       = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'Counter example built with React + TypeScript + Vite',

    addAppStore = true,
    developer   = 'Your Name',
    headerImage = 'nui://' .. GetCurrentResourceName() .. '/ui/header.webp',
    swiperItems = {
        'nui://' .. GetCurrentResourceName() .. '/ui/screenshot1.webp',
        'nui://' .. GetCurrentResourceName() .. '/ui/screenshot2.webp',
    },
})
```

| Field | Used When | Description |
|-------|-----------|-------------|
| `addAppStore` | always | Routes the app to App Store when `true` |
| `developer` | App Store | Developer line above the title |
| `headerImage` | App Store | Banner on the detail page |
| `swiperItems` | App Store | Screenshot carousel array |

You can mix `nui://` resource paths and public `https://` URLs in `headerImage`/`swiperItems`. To use NUI paths, drop the assets into `ui/` and they'll be served by FiveM automatically (`files { 'ui/**/*' }` in `fxmanifest.lua`).

## Job Restrictions

```lua
job = nil                                           -- everyone
job = { ['police'] = { 3, 4 } }                     -- only police grade 3 and 4
job = { ['police'] = {} }                           -- all police grades
job = { ['police'] = true }                         -- all police grades (alt syntax)
job = {
    ['police']    = { 3, 4 },
    ['ambulance'] = {},
    ['mechanic']  = true,
}
```

The phone re-evaluates the filter on every `QBCore:Client:OnJobUpdate`, so the app appears and disappears live as the player changes jobs.

## Important: Resource Naming

The icon URL must match the actual FiveM resource name — the folder name **without** category brackets. For `resources/[examples]/[codem-phone-example-app]/reactts` the resource is `reactts`, not `codem-phone-example-app`.

Always use `GetCurrentResourceName()` so renaming the folder doesn't break the icon URL:

```lua
icon = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
```

Apply the same pattern to header images, screenshots, and any other `nui://` URL.

## Troubleshooting

### `Failed to load ui/index.html (run npm run build?)`

You haven't built the UI yet. Run:

```bash
cd src
npm install   # first time only
npm run build
```

### `npm run build` fails with TS errors

`tsc -b` runs before `vite build`, so type errors block the bundle. Fix the type errors, or use `npm run typecheck` to see them in isolation.

### App doesn't appear on the home screen

- Ensure `codem-phone` starts **before** this resource (`ensure codem-phone` first in `server.cfg`).
- Check the client console for `[EXAMPLE-REACT-TS] Counter (React TS) registered successfully!`.
- If `job` is set, verify the player meets the role/grade.

### Icon shows as broken image

- The icon URL in `client/main.lua` must reference the real resource name. Use `GetCurrentResourceName()`.
- Confirm `ui/icon.svg` exists in the resource folder (`emptyOutDir: false` in `vite.config.ts` preserves it across builds).

### `npm run build` fails with `manualChunks not supported`

`vite-plugin-singlefile` already sets `inlineDynamicImports: true`, which is incompatible with `manualChunks`. Make sure you don't add a custom `rollupOptions.output.manualChunks` entry — the plugin handles bundling on its own.

### Callbacks always time out

- Server event name format must be `codem-phone:customApp:{identifier}:{action}`.
- The handler must call `cb(result)`. Forgetting it leaves the UI hanging until the 10s `sendCallback` timeout.
- Verify the third argument to `sendCallback` is `true` for server callbacks.

### HMR works in `npm run dev` but not in-game

That's by design — the in-game iframe loads a built `ui/index.html` snapshot. Use `npm run watch` for fast in-game iteration, or test most logic in the standalone dev server first.
