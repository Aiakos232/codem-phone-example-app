# Codem Phone - Example Custom App

A comprehensive example project demonstrating how to create custom apps for **codem-phone**. Learn all the core concepts through a simple counter application.

## 📋 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [File Structure](#-file-structure)
- [How It Works](#-how-it-works)
- [App Store Integration](#-app-store-integration)
- [API Reference](#-api-reference)
- [Creating Your Own App](#-creating-your-own-app)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **Counter Application**: Increment, decrement, and reset functionality
- **Server-Side Data Management**: Counter value is stored on the server
- **Callback System**: Asynchronous communication between Client ↔ Server
- **Notification Support**: Send phone notifications
- **Job Restrictions**: Limit app visibility by job and grade
- **App Store Integration**: Add apps to App Store for users to download
- **Custom Developer Name**: Display your name as the app developer
- **Header Images & Screenshots**: Showcase your app with images in App Store
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

## 🏪 App Store Integration

Instead of adding your app directly to the home screen, you can add it to the App Store so users can download it themselves.

### Basic App Store Setup

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'example-counter',
    name = 'Counter App',
    icon = 'nui://codem-phone-example-app/ui/icon.svg',
    ui = htmlContent,
    description = 'A simple counter example app',

    -- App Store Configuration
    addAppStore = true,                    -- Add to App Store instead of home screen
    developer = 'Your Developer Name',     -- Developer name shown in App Store
    headerImage = 'https://example.com/header.webp',  -- Header image for app page
    swiperItems = {                        -- Preview screenshots
        'https://example.com/screenshot1.webp',
        'https://example.com/screenshot2.webp',
        'https://example.com/screenshot3.webp',
    },

    -- Other options...
})
```

### App Store Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `addAppStore` | boolean | If `true`, app appears in App Store instead of home screen |
| `developer` | string | Developer name displayed in App Store (default: "Developed by CodeM") |
| `headerImage` | string | Header image URL for App Store detail page |
| `swiperItems` | table | Array of screenshot URLs for App Store preview |

### Image Sources

You can use different image sources:

```lua
-- External URL (https)
headerImage = 'https://your-domain.com/images/header.webp',

-- NUI path (local resource)
headerImage = 'nui://your-resource-name/ui/header.webp',

-- Mixed sources for swiperItems
swiperItems = {
    'https://your-domain.com/screenshot1.webp',
    'nui://your-resource-name/ui/screenshot2.webp',
},
```

### Complete Example

```lua
exports['codem-phone']:AddCustomApp({
    identifier = 'my-awesome-app',
    name = 'My Awesome App',
    icon = 'nui://my-app/ui/icon.svg',
    ui = htmlContent,
    description = 'An awesome app for your phone',
    defaultApp = false,
    notification = true,

    -- App Store options
    addAppStore = true,
    developer = 'Awesome Developer',
    headerImage = 'nui://my-app/ui/header.webp',
    swiperItems = {
        'nui://my-app/ui/preview1.webp',
        'nui://my-app/ui/preview2.webp',
        'nui://my-app/ui/preview3.webp',
        'nui://my-app/ui/preview4.webp',
    },

    -- Job restrictions (optional)
    job = {
        ['police'] = true,
    },

    onOpen = function()
        print('[MY-APP] App opened')
    end,
    onClose = function()
        print('[MY-APP] App closed')
    end
})
```

### Home Screen vs App Store

| Feature | Home Screen (`addAppStore = false`) | App Store (`addAppStore = true`) |
|---------|-------------------------------------|----------------------------------|
| Visibility | Immediately visible on home screen | Listed in App Store |
| Installation | Auto-installed | User must download |
| Removal | Can be removed by user | Can be uninstalled |
| Developer info | Not shown | Shown in App Store |
| Screenshots | Not applicable | Shown in App Store |

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

## 📝 Notes

- **Data Persistence**: In this example, counter values are stored in memory. For production apps, use a database (oxmysql, ghmattimysql, etc.)
- **Security**: Remember to add input validation and rate limiting in production
- **Performance**: Avoid sending callbacks too frequently

## 📄 License

This example project is for learning purposes and is free to use.

## 👨‍💻 Author

**Codem** - codem-phone development team

---

> 💡 **Tip**: Use this example as a foundation to build more complex applications like banking, messaging, GPS, and more!
