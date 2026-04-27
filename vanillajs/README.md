# Codem Phone — Custom App Example (Vanilla JS)

A complete, build-free reference implementation of a custom app for **codem-phone**. The UI is plain HTML/CSS/JavaScript inside `ui/index.html` — no bundler, no transpiler. Use this flavor when you want the fastest possible iteration loop or when you're learning the platform.

## Table of Contents

- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Customizing the UI](#customizing-the-ui)
- [How It Works](#how-it-works)
- [AddCustomApp Reference](#addcustomapp-reference)
- [codem-phone Exports](#codem-phone-exports)
- [Server-Side Callbacks](#server-side-callbacks)
- [mphone Protocol](#mphone-protocol)
- [App Store Integration](#app-store-integration)
- [Job Restrictions](#job-restrictions)
- [Important: Resource Naming](#important-resource-naming)
- [Troubleshooting](#troubleshooting)

## Requirements

| Resource | Description |
|----------|-------------|
| `codem-phone` | Main phone resource (required as dependency) |
| FiveM Server | `cerulean` or higher `fx_version` |

No Node.js, no build tooling — just edit and restart.

## Project Structure

```
vanillajs/
├── fxmanifest.lua          # Resource manifest
├── client/
│   └── main.lua            # AddCustomApp registration + lifecycle
├── server/
│   └── main.lua            # Counter callback handlers (server-side state)
├── ui/
│   ├── index.html          # Self-contained UI (HTML/CSS/JS in one file)
│   └── icon.svg            # App icon shown on home screen and notifications
└── README.md
```

## Installation

1. Copy this folder into your `resources/` directory (any category folder is fine).
2. Add the resource to your `server.cfg`, **after** `codem-phone`:

   ```cfg
   ensure codem-phone
   ensure vanillajs
   ```

   Replace `vanillajs` with whatever you renamed the folder to. The phone reads the icon from `nui://<resource-name>/ui/icon.svg`, and the client uses `GetCurrentResourceName()` so the icon path tracks the folder name automatically.

3. Restart the server (or `start vanillajs` from the txAdmin / live console).
4. Open the phone in-game — the **Counter App** appears on the home grid.

## Customizing the UI

Edit `ui/index.html` directly. There is no build step. After saving:

```
restart vanillajs
```

…and re-open the phone. The new HTML is read fresh on each `phoneLoaded` event.

The bundled example demonstrates:

- Server-backed state (the counter value lives on the server, not in the iframe)
- Asynchronous callbacks via `mphone:callback`
- Phone notifications via `mphone:notification`
- Receiving `mphone:init` to display the player's phone number

## How It Works

Custom apps are isolated `<iframe>`s inside the phone NUI. Communication between the app and the phone is exclusively via `window.postMessage` (the `mphone:*` protocol). The iframe is sandboxed (`allow-scripts allow-forms allow-popups`) and cannot reach FiveM natives directly.

```
┌────────────────────────┐   postMessage   ┌──────────────────────┐
│ ui/index.html (iframe) │ ◄─────────────► │  codem-phone NUI     │
└────────────────────────┘                 └──────────┬───────────┘
                                                      │ NUI callback
                                                      ▼
                                          ┌────────────────────────┐
                                          │  client/main.lua       │
                                          │  (this resource)       │
                                          └──────────┬─────────────┘
                                                     │ TriggerEvent
                                                     ▼
                                          ┌────────────────────────┐
                                          │  server/main.lua       │
                                          │  (this resource)       │
                                          └────────────────────────┘
```

Lifecycle:

1. `codem-phone` starts → fires `codem-phone:phoneLoaded` event.
2. This resource calls `exports['codem-phone']:AddCustomApp(...)` with an HTML payload (`ui/index.html`) and a unique `identifier`.
3. The phone NUI registers the app and renders its icon on the home grid.
4. When the user opens the app, the iframe loads with `srcdoc=<your html>` and the phone posts a `mphone:init` message.
5. The app calls `mphone:callback` to invoke server/client event handlers; the response is delivered back as `mphone:callback:response`.

## AddCustomApp Reference

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter',                       -- required, must be unique
    name       = 'Counter App',                           -- required, display name
    ui         = htmlContent,                             -- required, HTML string

    icon        = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'A simple counter example app',
    defaultApp  = false,                                  -- if true, comes pre-installed
    notification = true,                                  -- enable notification banners

    -- Optional: restrict visibility to specific job/grade combinations
    job = {
        ['police']    = { 3, 4 },   -- only grades 3 and 4
        ['ambulance'] = true,       -- all grades
    },

    -- Optional: lifecycle callbacks (Lua-side)
    onOpen  = function() print('opened')  end,
    onClose = function() print('closed') end,

    -- Optional: App Store fields (only used when addAppStore = true)
    addAppStore = false,
    developer   = 'Your Name',
    headerImage = 'https://your-cdn/header.webp',
    swiperItems = {
        'https://your-cdn/screenshot1.webp',
        'https://your-cdn/screenshot2.webp',
    },
})
```

Returns `success, err`. `err` is a string when `success` is `false`.

| Option | Type | Required | Description |
|--------|------|:--------:|-------------|
| `identifier` | string | yes | Unique app id; used in event names and routing |
| `name` | string | yes | Display name on the home screen |
| `ui` | string | yes | Raw HTML loaded into the iframe via `srcdoc` |
| `icon` | string | no | NUI URL or absolute URL to the icon image |
| `description` | string | no | Short description (App Store + accessibility) |
| `defaultApp` | bool | no | Pre-installed (cannot be uninstalled by user) |
| `notification` | bool | no | Default `true`; allows notification banners |
| `job` | table | no | Job/grade visibility filter (see below) |
| `onOpen` | function | no | Fired when the user enters the app view |
| `onClose` | function | no | Fired when the user leaves the app view |
| `addAppStore` | bool | no | If `true`, app appears in App Store instead of home |
| `developer` | string | no | Developer name shown in App Store |
| `headerImage` | string | no | App Store detail page header image URL |
| `swiperItems` | string[] | no | App Store screenshot carousel images |

## codem-phone Exports

```lua
-- Register an app (home screen or App Store)
exports['codem-phone']:AddCustomApp(options)            -- → success, err

-- Remove an app you previously registered
exports['codem-phone']:RemoveCustomApp(identifier)      -- → success, err

-- Read back an app's config
exports['codem-phone']:GetCustomApp(identifier)         -- → table | nil

-- Push a broadcast message to your app's UI (e.g. live updates)
exports['codem-phone']:SendCustomAppMessage(identifier, message)

-- Check if the phone is currently open in the user's view
exports['codem-phone']:IsPhoneOpen()                    -- → bool
```

`RemoveCustomApp` and `SendCustomAppMessage` will only succeed if called from the same resource that registered the app (enforced by `GetInvokingResource()`).

## Server-Side Callbacks

When the UI calls `mphone:callback` with `server: true`, the phone proxies it to a server-side event in this format:

```
codem-phone:customApp:{identifier}:{action}
```

The handler signature is `(source, payload, cb)` — call `cb(result)` to send a response back to the iframe.

```lua
-- server/main.lua
AddEventHandler('codem-phone:customApp:example-counter:increment', function(source, payload, cb)
    local newValue = doSomething(source)
    cb({ success = true, count = newValue })
end)
```

Responses are returned to the UI as the resolved value of `sendCallback(...)` (see [mphone Protocol](#mphone-protocol)). If you don't call `cb` within 5 seconds the call times out client-side.

For client-side callbacks (`server: false`), use `AddEventHandler` on the **client** with the same name format. Note the client path uses a `Wait` poll, so keep responses fast.

## mphone Protocol

All UI ↔ phone communication is `window.postMessage` against `window.parent`.

### App → Host (you send these from `ui/index.html`)

| Type | Payload | Purpose |
|------|---------|---------|
| `mphone:callback` | `{ action, payload, callbackId, server }` | Invoke server/client event handler |
| `mphone:notification` | `{ header, message }` | Show notification banner |
| `mphone:close` | — | Close the app (return to home) |
| `mphone:waypoint` | `{ x, y }` | Place a GPS waypoint in-game |
| `mphone:player` | `{ callbackId }` | Request fresh player info |

### Host → App (sent to your iframe)

| Type | Payload | Purpose |
|------|---------|---------|
| `mphone:init` | `{ player, theme, language, identifier }` | Sent on every entry into the app |
| `mphone:callback:response` | `{ callbackId, result }` | Result of an `mphone:callback` |
| `mphone:player:response` | `{ callbackId, result }` | Result of an `mphone:player` request |
| `broadcast` | `{ message }` | Custom message pushed via `SendCustomAppMessage` |

### Minimal callback wrapper

```html
<script>
    const pending = {};

    function callback(action, payload = {}, server = true) {
        return new Promise(resolve => {
            const id = "cb_" + Math.random().toString(36).slice(2);
            pending[id] = resolve;
            window.parent.postMessage({
                type: "mphone:callback",
                action,
                payload,
                callbackId: id,
                server,
            }, "*");
        });
    }

    window.addEventListener("message", (e) => {
        const d = e.data;
        if (d?.type === "mphone:callback:response" && pending[d.callbackId]) {
            pending[d.callbackId](d.result);
            delete pending[d.callbackId];
        }
        if (d?.type === "mphone:init") {
            // Player info, theme, language available here
        }
    });

    // Example use:
    callback("increment").then(res => console.log(res.count));
</script>
```

## App Store Integration

Set `addAppStore = true` to publish into the App Store instead of installing onto the home screen directly. Users browse and tap **Install** to add it to their phone.

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter',
    name       = 'Counter App',
    ui         = htmlContent,
    icon       = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
    description = 'A simple counter example app',

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
| `developer` | App Store | Developer line shown above the title |
| `headerImage` | App Store | Banner on the detail page |
| `swiperItems` | App Store | Screenshot carousel array |

You can mix `nui://` resource paths with public `https://` URLs.

## Job Restrictions

`job` accepts the following shapes:

```lua
-- All players (no restriction)
job = nil    -- or omit the field entirely

-- Specific grades only
job = {
    ['police']    = { 3, 4 },
    ['ambulance'] = { 2, 3 },
}

-- All grades of a job (use empty table OR true)
job = {
    ['police'] = {},
}

job = {
    ['police'] = true,
}

-- Mixed
job = {
    ['police']    = { 3, 4 },   -- specific grades
    ['ambulance'] = {},         -- all grades
    ['mechanic']  = true,       -- all grades
}
```

The phone re-evaluates the filter on every `QBCore:Client:OnJobUpdate`, so the app appears and disappears live as the player changes jobs.

## Important: Resource Naming

The icon URL **must** match the actual FiveM resource name. The resource name is the folder name **without** category brackets — for example, if the path is `resources/[examples]/[codem-phone-example-app]/vanillajs`, the resource name is `vanillajs`, not `codem-phone-example-app`.

To stay safe across renames, always use `GetCurrentResourceName()`:

```lua
icon = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
```

The same rule applies to any other `nui://` URL you use (header images, screenshots, etc.).

## Troubleshooting

### App doesn't appear on the home screen

- Ensure `codem-phone` is started **before** this resource (`ensure codem-phone` first in `server.cfg`).
- Check the client console for `[EXAMPLE-APP] Counter app registered successfully!`.
- If `job` is set, verify the player meets the role/grade.

### Icon shows as broken image

- The icon URL in `client/main.lua` must reference the real resource name. Use `GetCurrentResourceName()`.
- Confirm `ui/icon.svg` exists in the resource folder.
- `fxmanifest.lua` must include the file via `files { 'ui/**/*' }` (this template already does).

### Notification icon is missing

- Same as above — the notification banner uses the same `icon` URL passed to `AddCustomApp`.
- If you call `mphone:notification` from the iframe, the phone uses the registered icon automatically.

### Callbacks always time out

- Server event name format must be `codem-phone:customApp:{identifier}:{action}`.
- The handler must call `cb(result)` — forgetting to call it leaves the UI hanging until the 10s timeout.
- Verify `server: true` is set in the iframe `mphone:callback` payload when targeting a server handler.

### UI doesn't update after I edited `ui/index.html`

- Run `restart <resource-name>` so the phone re-reads the file.
- Re-open the phone (the iframe `srcdoc` is set on app open).
