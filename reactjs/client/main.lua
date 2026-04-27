-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App (React JS) — Client Side
-- ════════════════════════════════════════════════════════════════════════════

local Config = {
    addToAppStore = false,
}

RegisterNetEvent('codem-phone:phoneLoaded')
AddEventHandler('codem-phone:phoneLoaded', function()
    Wait(2000)
    LoadPhoneApp()
end)

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        Wait(2000)
        LoadPhoneApp()
    end
end)

function LoadPhoneApp()
    while GetResourceState('codem-phone') ~= 'started' do
        print('^3[EXAMPLE-REACT] Waiting for codem-phone to start...^7')
        Wait(100)
    end
    Wait(1000)

    local resourceName = GetCurrentResourceName()
    local htmlContent = LoadResourceFile(resourceName, 'ui/index.html')
    if not htmlContent then
        print('^1[EXAMPLE-REACT] Failed to load ui/index.html (run npm run build?)^7')
        return
    end

    local success, err = exports['codem-phone']:AddCustomApp({
        identifier = 'example-counter-react',
        name = 'Counter (React)',
        icon = 'nui://' .. resourceName .. '/ui/icon.svg',
        ui = htmlContent,
        description = 'Counter example built with React + Vite',
        defaultApp = false,
        notification = true,

        addAppStore = Config.addToAppStore,
        developer = 'Example Developer',

        job = {},

        onOpen = function() print('[EXAMPLE-REACT] Counter app opened') end,
        onClose = function() print('[EXAMPLE-REACT] Counter app closed') end,
    })

    if success then
        print('^2[EXAMPLE-REACT] Counter (React) registered successfully!^7')
    else
        print('^1[EXAMPLE-REACT] Failed to register: ' .. tostring(err) .. '^7')
    end
end
