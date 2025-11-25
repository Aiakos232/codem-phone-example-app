-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App - Client Side
-- This example shows how to add a custom app to codem-phone
-- ════════════════════════════════════════════════════════════════════════════

local appRegistered = false

-- Register the app when codem-phone is ready
CreateThread(function()
    -- Wait for codem-phone to start
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
        icon = 'nui://phone-app-example/ui/icon.svg',
        ui = htmlContent,
        description = 'A simple counter example app',
        defaultApp = false,
        notification = true,
        onOpen = function()
            print('[EXAMPLE-APP] Counter app opened')
        end,
        onClose = function()
            print('[EXAMPLE-APP] Counter app closed')
        end
    })

    if success then
        appRegistered = true
        print('^2[EXAMPLE-APP] Counter app registered successfully!^7')
    else
        print('^1[EXAMPLE-APP] Failed to register counter app: ' .. tostring(err) .. '^7')
    end
end)

-- Client-side callback example (used when server=false)
AddEventHandler('codem-phone:customApp:example-counter:clientAction', function(payload, cb)
    print('[EXAMPLE-APP] Client action received:', json.encode(payload))
    cb({ success = true, message = 'Client callback works!' })
end)
