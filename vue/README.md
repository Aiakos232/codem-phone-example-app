# Codem Phone — Custom App Example (Vue 3 + Vite)

A complete reference implementation of a custom app for **codem-phone**, built with **Vue 3 + Vite**. Single File Components, scoped styles, HMR during development, and a Vite plugin that inlines the entire bundle into one self-contained `ui/index.html`.

## Table of Contents

- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Production Build](#production-build)
- [How It Works](#how-it-works)
- [The mphone.js Helper](#the-mphonejs-helper)
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
| npm / pnpm / yarn | any | Package manager (examples below use npm) |

## Project Structure

```
vue/
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
│   ├── vite.config.js
│   ├── index.html             # Vite entry HTML (NOT the FiveM-loaded one)
│   ├── main.js                # createApp + mount
│   ├── App.vue                # Root SFC
│   ├── mphone.js              # codem-phone iframe bridge (reusable)
│   └── style.css              # Global styles
└── README.md
```

`src/index.html` is the **Vite source** — `vite-plugin-singlefile` inlines all assets into a single self-contained file and outputs it to `../ui/index.html`. The FiveM resource only loads from `ui/index.html`.

## Installation

1. Copy this folder into your `resources/` directory.
2. Build the UI at least once before starting the resource:

   ```bash
   cd src
   npm install
   npm run build
   ```

   This produces `ui/index.html`, which is what the phone reads.

3. Add to `server.cfg` **after** `codem-phone`:

   ```cfg
   ensure codem-phone
   ensure vue
   ```

   Replace `vue` with your actual folder name. The Lua client uses `GetCurrentResourceName()`, so renaming the folder doesn't break the icon URL.

4. Restart the server. Open the phone in-game — **Counter (Vue)** appears on the home grid.

## Development Workflow

The recommended loop:

```bash
cd src
npm run dev      # Vite dev server with HMR
```

This starts a standalone browser at `http://localhost:5173`. The phone's `mphone:init` message won't fire there because there's no parent phone — see [Mocking init during dev](#mocking-init-during-dev).

For in-game testing with quick rebuilds, use **watch mode**:

```bash
cd src
npm run watch    # Rebuilds ../ui/index.html on every save
```

Then `restart vue` (or run `restart <your-resource-name>`) to pick up the new bundle.

### Mocking init during dev

The dev server has no phone parent, so `mphone:init` never arrives. To exercise the same code path standalone, dispatch a fake event in `main.js`:

```js
if (import.meta.env.DEV) {
    setTimeout(() => {
        window.dispatchEvent(new MessageEvent("message", {
            data: {
                type: "mphone:init",
                player: { phoneNumber: "555-DEV", name: "Dev Player" },
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
npm run build    # tsc-free single-shot build → ../ui/index.html
```

`vite-plugin-singlefile` does the heavy lifting — JS, CSS, and assets are inlined into one file. The build leaves `ui/icon.svg` untouched (`emptyOutDir: false`).

After the build completes, restart the resource:

```
restart vue
```

## How It Works

Custom apps run inside an isolated `<iframe>` with sandbox `allow-scripts allow-forms allow-popups`. They can't access FiveM natives — instead they communicate with the phone via `window.postMessage` (the `mphone:*` protocol).

```
┌──────────────────────────┐   postMessage   ┌──────────────────────┐
│ ui/index.html (iframe)   │ ◄─────────────► │  codem-phone NUI     │
│ (Vue 3 app, single file) │                 └──────────┬───────────┘
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
5. Your Vue app calls `sendCallback(...)` from `mphone.js` to invoke server/client handlers.

## The mphone.js Helper

`src/mphone.js` is the reusable iframe bridge. It wraps the raw `postMessage` protocol in a friendlier API.

```js
import { sendCallback, onInit, notify, close, setWaypoint } from "./mphone";

// Player info on init
onInit(player => {
    console.log(player.phoneNumber, player.name);
});

// Server callback (returns a Promise)
const result = await sendCallback("increment", {}, true);
console.log(result.count);

// Show a phone notification
notify("Counter App", "Count is now " + result.count);

// Close the app and return to home
close();

// Place a GPS waypoint
setWaypoint(123.4, -456.7);
```

| Function | Signature | Notes |
|----------|-----------|-------|
| `sendCallback(action, payload, toServer = true)` | `Promise<result>` | 10s timeout; resolves with `{ success: false, error: "Timeout" }` if exceeded |
| `onInit(cb)` | `cb(player)` | Listens for every `mphone:init`; safe to call once at app boot |
| `notify(header, message)` | `void` | Triggers the phone notification banner |
| `close()` | `void` | Returns to phone home |
| `setWaypoint(x, y)` | `void` | GTA world coordinates |

## AddCustomApp Reference

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter-vue',
    name       = 'Counter (Vue)',
    ui         = htmlContent,                                          -- contents of ui/index.html

    icon        = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'Counter example built with Vue 3',
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

`SendCustomAppMessage` reaches your Vue app as a `broadcast` event — listen for it via:

```js
window.addEventListener("message", e => {
    if (e.data?.type === "broadcast") {
        console.log("Broadcast:", e.data.message);
    }
});
```

## Server-Side Callbacks

When the iframe calls `sendCallback(action, payload, true)`, the phone proxies it to a server-side event in this format:

```
codem-phone:customApp:{identifier}:{action}
```

```lua
-- server/main.lua
AddEventHandler('codem-phone:customApp:example-counter-vue:increment', function(source, payload, cb)
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

`mphone.js` already handles `mphone:callback:response` plumbing — you only need to deal with `mphone:init` and `broadcast` directly.

## App Store Integration

Set `addAppStore = true` to publish into the App Store instead of installing onto the home screen.

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter-vue',
    name       = 'Counter (Vue)',
    ui         = htmlContent,
    icon       = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'Counter example built with Vue 3',

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

The icon URL must match the actual FiveM resource name — the folder name **without** category brackets. For `resources/[examples]/[codem-phone-example-app]/vue` the resource is `vue`, not `codem-phone-example-app`.

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

### App doesn't appear on the home screen

- Ensure `codem-phone` starts **before** this resource (`ensure codem-phone` first in `server.cfg`).
- Check the client console for `[EXAMPLE-VUE] Counter (Vue) registered successfully!`.
- If `job` is set, verify the player meets the role/grade.

### Icon shows as broken image

- The icon URL in `client/main.lua` must reference the real resource name. Use `GetCurrentResourceName()`.
- Confirm `ui/icon.svg` exists in the resource folder (`emptyOutDir: false` in `vite.config.js` preserves it across builds).

### `npm run build` fails with `manualChunks not supported`

`vite-plugin-singlefile` already sets `inlineDynamicImports: true`, which is incompatible with `manualChunks`. Make sure you don't add a custom `rollupOptions.output.manualChunks` entry — the plugin handles bundling on its own.

### Callbacks always time out

- Server event name format must be `codem-phone:customApp:{identifier}:{action}`.
- The handler must call `cb(result)`. Forgetting it leaves the UI hanging until the 10s `sendCallback` timeout.
- Verify the third argument to `sendCallback` is `true` for server callbacks.

### HMR works in `npm run dev` but not in-game

That's by design — the in-game iframe loads a built `ui/index.html` snapshot. Use `npm run watch` for fast in-game iteration, or test most logic in the standalone dev server first.
