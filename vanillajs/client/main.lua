-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App - Client Side
-- This example shows how to add a custom app to codem-phone
-- ════════════════════════════════════════════════════════════════════════════

-- Configuration
local Config = {
    -- Set to true to add app to App Store (users download it)
    -- Set to false to add app directly to home screen
    addToAppStore = false,
}

local appRegistered = false
RegisterNetEvent('codem-phone:phoneLoaded')
AddEventHandler('codem-phone:phoneLoaded', function()
    Wait(2000)
    LoadPhoneApp()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if (resourceName == GetCurrentResourceName()) then
        Wait(2000)
        LoadPhoneApp()
    end
end)


function LoadPhoneApp()
    while GetResourceState('codem-phone') ~= 'started' do
        print('^3[EXAMPLE-APP] Waiting for codem-phone to start...^7')
        Wait(100)
    end

    -- Small delay
    Wait(1000)

    -- Read HTML content
    local htmlContent = LoadResourceFile(GetCurrentResourceName(), 'ui/index.html')

    if not htmlContent then
        print('^1[EXAMPLE-APP] Failed to load HTML content^7')
        return
    end

    -- Register the app
    local success, err = exports['codem-phone']:AddCustomApp({
        identifier = 'example-counter',
        name = 'Counter App',
        icon = 'nui://' .. GetCurrentResourceName() .. '/ui/icon.svg',
        ui = htmlContent,
        description = 'A simple counter example app',
        defaultApp = false,
        notification = true,

        -- App Store options (only used when addAppStore = true)
        addAppStore = Config.addToAppStore,                                                                   -- If true, app appears in App Store instead of home screen
        developer = 'Example Developer',                                                                      -- Optional: Developer name shown in App Store
        headerImage =
        "https://aiakos.net/codem/api.php?script=codem-phone&subfolder=appstoreswiperitems&file=twix-1.webp", -- Optional: Header image for App Store page (e.g., 'nui://phone-app-example/ui/header.png')
        swiperItems = {
            'https://aiakos.net/codem/api.php?script=codem-phone&subfolder=appstoreswiperitems&file=twix-1.webp',
            'https://aiakos.net/codem/api.php?script=codem-phone&subfolder=appstoreswiperitems&file=twix-2.webp',
            'https://aiakos.net/codem/api.php?script=codem-phone&subfolder=appstoreswiperitems&file=twix-3.webp',
            'https://aiakos.net/codem/api.php?script=codem-phone&subfolder=appstoreswiperitems&file=twix-4.webp',
        }, -- Optional: Preview images for App Store page

        -- Job restrictions (optional)
        job = {
            -- ['police'] = { 3, 4 },  -- Only police grade 3 and 4
            -- ['ambulance'] = true     -- All ambulance grades
        },

        onOpen = function()
            print('[EXAMPLE-APP] Counter app opened')
        end,
        onClose = function()
            print('[EXAMPLE-APP] Counter app closed')
        end
    })

    if success then
        appRegistered = true
        if Config.addToAppStore then
            print('^2[EXAMPLE-APP] Counter app added to App Store!^7')
        else
            print('^2[EXAMPLE-APP] Counter app registered successfully!^7')
        end
    else
        print('^1[EXAMPLE-APP] Failed to register counter app: ' .. tostring(err) .. '^7')
    end
end

-- Client-side callback example (used when server=false)
AddEventHandler('codem-phone:customApp:example-counter:clientAction', function(payload, cb)
    print('[EXAMPLE-APP] Client action received:', json.encode(payload))
    cb({ success = true, message = 'Client callback works!' })
end)
