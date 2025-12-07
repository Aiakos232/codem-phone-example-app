# Codem Phone - Example Custom App

A comprehensive example project demonstrating how to create custom apps for **codem-phone**. Learn all the core concepts through a simple counter application.

## 📋 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [File Structure](#-file-structure)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Creating Your Own App](#-creating-your-own-app)
- [CSS Units - Important](#-css-units---important)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **Counter Application**: Increment, decrement, and reset functionality
- **Server-Side Data Management**: Counter value is stored on the server
- **Callback System**: Asynchronous communication between Client ↔ Server
- **Notification Support**: Send phone notifications
- **Job Restrictions**: Limit app visibility by job and grade
- **Modern UI**: Gradient backgrounds, animations, and responsive design
- **Player Information**: Phone number display

## 📦 Requirements

| Resource | Description |
|----------|-------------|
| `codem-phone` | Main phone resource (required as dependency) |
| FiveM Server | Cerulean or higher fx_version |

## 🚀 Installation

1. **Download the Resource**
   ```bash
   # Copy to your resources folder
   resources/[custom-apps]/codem-phone-example-app/
   ```

2. **Add to server.cfg**
   ```cfg
   ensure codem-phone
   ensure codem-phone-example-app
   ```

3. **Restart the Server**
   - `codem-phone` must start first (dependency)

## 📁 File Structure

```
codem-phone-example-app/
├── fxmanifest.lua      # Resource manifest file
├── client/
│   └── main.lua        # Client-side app registration and event handlers
├── server/
│   └── main.lua        # Server-side callback handlers and data management
└── ui/
    ├── index.html      # Application UI (HTML/CSS/JS)
    └── icon.svg        # Application icon
```

## 🔧 How It Works

### 1. App Registration (Client-Side)

The app is registered using the `AddCustomApp` export after `codem-phone` starts:

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter',    -- Unique app ID
    name = 'Counter App',              -- Display name
    icon = 'nui://phone-app-example/ui/icon.svg',  -- Icon path
    ui = htmlContent,                  -- HTML content
    description = 'A simple counter example app',
    defaultApp = false,                -- Is it a default app?
    notification = true,               -- Notification support
    job = {                            -- Job restrictions (optional)
        ['police'] = { 3, 4 },         -- Police grade 3 and 4 only
        ['ambulance'] = { 2, 3 }       -- Ambulance grade 2 and 3 only
    },
    onOpen = function()                -- Function called when opened
        print('[EXAMPLE-APP] Counter app opened')
    end,
    onClose = function()               -- Function called when closed
        print('[EXAMPLE-APP] Counter app closed')
    end
})
```

### Job Restrictions

You can restrict app visibility based on player's job and grade using the `job` parameter:

```lua
-- Only specific grades can see the app
job = {
    ['police'] = { 3, 4 },     -- Only police grade 3 and 4
    ['ambulance'] = { 2, 3 }   -- Only ambulance grade 2 and 3
}

-- All grades of a job can see the app (empty table)
job = {
    ['police'] = {}            -- All police grades
}

-- All grades of a job can see the app (true)
job = {
    ['police'] = true          -- All police grades
}

-- Multiple jobs with mixed access
job = {
    ['police'] = { 3, 4 },     -- Police grade 3 and 4 only
    ['ambulance'] = {},        -- All ambulance grades
    ['mechanic'] = true        -- All mechanic grades
}

-- No job restriction (everyone can see)
job = nil                      -- Or simply don't include the parameter
```

**How it works:**
- If `job` is `nil` or not specified, everyone can see the app
- If `job` is specified, only players with matching job AND grade can see the app
- The app automatically appears/disappears when player's job changes

### 2. Server-Side Callbacks

Callbacks are handled using event handlers on the server:

```lua
-- Event format: codem-phone:customApp:{identifier}:{action}
AddEventHandler('codem-phone:customApp:example-counter:increment', function(source, payload, cb)
    -- Process the request
    cb({ success = true, count = newValue })
end)
```

**Available Callbacks:**
| Action | Description |
|--------|-------------|
| `getCounter` | Gets the current counter value |
| `increment` | Increases counter by 1 |
| `decrement` | Decreases counter by 1 (min: 0) |
| `reset` | Resets counter to 0 |

### 3. UI ↔ Lua Communication

**Sending Messages from UI to Server:**
```javascript
window.parent.postMessage({
    type: 'mphone:callback',
    action: 'increment',      // Callback action name
    payload: {},              // Data to send
    callbackId: 'unique-id',  // Unique ID for response
    server: true              // true = server, false = client
}, '*');
```

**Receiving Responses:**
```javascript
window.addEventListener('message', function(event) {
    if (event.data.type === 'mphone:callback:response') {
        // Response is in event.data.result
    }
});
```

**Sending Notifications:**
```javascript
window.parent.postMessage({
    type: 'mphone:notification',
    header: 'Counter App',
    message: 'Current count is: ' + currentCount
}, '*');
```

**Closing the App:**
```javascript
window.parent.postMessage({ type: 'mphone:close' }, '*');
```

## 📚 API Reference

### PostMessage Types

| Type | Direction | Description |
|------|-----------|-------------|
| `mphone:init` | Phone → App | Sent when app is initialized |
| `mphone:callback` | App → Phone | Sends callback to Server/Client |
| `mphone:callback:response` | Phone → App | Callback response |
| `mphone:notification` | App → Phone | Shows notification |
| `mphone:close` | App → Phone | Closes the app |
| `broadcast` | Server → App | Broadcast message from server |

### mphone:init Payload

```javascript
{
    type: 'mphone:init',
    player: {
        phoneNumber: '555-1234',
        // Other player information
    },
    theme: 'dark',
    language: 'en'
}
```

## 🛠 Creating Your Own App

### Step 1: Create the File Structure

```
your-app/
├── fxmanifest.lua
├── client/
│   └── main.lua
├── server/
│   └── main.lua
└── ui/
    ├── index.html
    └── icon.svg
```

### Step 2: fxmanifest.lua

```lua
fx_version 'cerulean'
game 'gta5'

author 'Your Name'
description 'Your Custom Phone App'
version '1.0.0'

client_scripts {
    'client/main.lua'
}

server_scripts {
    'server/main.lua'
}

files {
    'ui/**/*'
}

dependency 'codem-phone'
```

### Step 3: Use a Unique Identifier

```lua
-- client/main.lua
exports['codem-phone']:AddCustomApp({
    identifier = 'your-unique-app-id',  -- MUST be unique!
    -- ...
})
```

### Step 4: Event Naming

```lua
-- Server events must follow this format:
-- codem-phone:customApp:{identifier}:{action}

AddEventHandler('codem-phone:customApp:your-unique-app-id:yourAction', function(source, payload, cb)
    -- ...
end)
```

## ⚠️ CSS Units - Important

> **CRITICAL**: You must use **only `em` and `%` units** in your CSS styling. Other CSS units like `px`, `rem`, `vh`, `vw`, etc. **will NOT work properly** within the phone interface.

### ✅ Correct Usage

```css
.container {
    width: 100%;
    padding: 1em;
    margin: 0.5em;
    font-size: 1.2em;
}

.button {
    width: 50%;
    height: 3em;
    border-radius: 0.5em;
}
```

### ❌ Incorrect Usage

```css
/* DO NOT USE THESE UNITS */
.container {
    width: 300px;      /* ❌ px will not work */
    padding: 1rem;     /* ❌ rem will not work */
    margin: 2vh;       /* ❌ vh will not work */
    font-size: 16px;   /* ❌ px will not work */
}
```

### Unit Conversion Guide

| Instead of | Use |
|------------|-----|
| `16px` | `1em` |
| `100vh` | `100%` |
| `100vw` | `100%` |
| `1rem` | `1em` |
| `24px` | `1.5em` |

## 🔍 Troubleshooting

### App Not Showing

1. Ensure `codem-phone` resource is running
2. Check console output:
   ```
   [EXAMPLE-APP] Waiting for codem-phone to start...
   [EXAMPLE-APP] Counter app registered successfully!
   ```

### Callbacks Not Working

1. Check server console for event handler registration message:
   ```
   [EXAMPLE-APP] Server callbacks registered
   ```
2. Ensure event names are in the correct format
3. Verify `server: true` parameter is set correctly

### UI Not Loading

1. Ensure `ui/index.html` file exists
2. Check that `files { 'ui/**/*' }` is in fxmanifest.lua
3. Check for HTML syntax errors

### Icon Not Showing

1. Verify the icon path is correct:
   ```lua
   icon = 'nui://your-resource-name/ui/icon.svg'
   ```
2. Ensure the SVG file is valid

### Styling Issues

1. **Check your CSS units** - only `em` and `%` are supported
2. Replace all `px`, `rem`, `vh`, `vw` units with `em` or `%`
3. Test your UI by resizing to ensure it scales properly

## 📝 Notes

- **Data Persistence**: In this example, counter values are stored in memory. For production apps, use a database (oxmysql, ghmattimysql, etc.)
- **Security**: Remember to add input validation and rate limiting in production
- **Performance**: Avoid sending callbacks too frequently
- **CSS Units**: Always use `em` and `%` for proper scaling within the phone interface

## 📄 License

This example project is for learning purposes and is free to use.

## 👨‍💻 Author

**Codem** - codem-phone development team

---

> 💡 **Tip**: Use this example as a foundation to build more complex applications like banking, messaging, GPS, and more!
