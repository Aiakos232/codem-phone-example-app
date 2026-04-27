-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App (Vue 3) — Client Side
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
        print('^3[EXAMPLE-VUE] Waiting for codem-phone to start...^7')
        Wait(100)
    end
    Wait(1000)

    local resourceName = GetCurrentResourceName()
    local htmlContent = LoadResourceFile(resourceName, 'ui/index.html')
    if not htmlContent then
        print('^1[EXAMPLE-VUE] Failed to load ui/index.html^7')
        return
    end

    local success, err = exports['codem-phone']:AddCustomApp({
        identifier = 'example-counter-vue',
        name = 'Counter (Vue)',
        icon = 'nui://' .. resourceName .. '/ui/icon.svg',
        ui = htmlContent,
        description = 'Counter example built with Vue 3',
        defaultApp = false,
        notification = true,


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
            print('[EXAMPLE-VUE] Counter app opened')
        end,
        onClose = function()
            print('[EXAMPLE-VUE] Counter app closed')
        end,
    })

    if success then
        print('^2[EXAMPLE-VUE] Counter (Vue) registered successfully!^7')
    else
        print('^1[EXAMPLE-VUE] Failed to register: ' .. tostring(err) .. '^7')
    end
end
