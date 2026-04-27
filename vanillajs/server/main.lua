-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App - Server Side
-- Listens for server-side callbacks (used when server=true)
-- ════════════════════════════════════════════════════════════════════════════

-- Table holding counter data (use a database in production)
local PlayerCounters = {}

-- Callback: Get counter
-- Event format: codem-phone:customApp:{identifier}:{action}
AddEventHandler('codem-phone:customApp:example-counter:getCounter', function(source, payload, cb)
    local count = PlayerCounters[source] or 0
    cb({
        success = true,
        count = count
    })
end)

-- Callback: Increment counter
AddEventHandler('codem-phone:customApp:example-counter:increment', function(source, payload, cb)
    PlayerCounters[source] = (PlayerCounters[source] or 0) + 1
    cb({
        success = true,
        count = PlayerCounters[source]
    })
end)

-- Callback: Decrement counter
AddEventHandler('codem-phone:customApp:example-counter:decrement', function(source, payload, cb)
    PlayerCounters[source] = math.max(0, (PlayerCounters[source] or 0) - 1)
    cb({
        success = true,
        count = PlayerCounters[source]
    })
end)

-- Callback: Reset counter
AddEventHandler('codem-phone:customApp:example-counter:reset', function(source, payload, cb)
    PlayerCounters[source] = 0
    cb({
        success = true,
        count = 0
    })
end)

-- Clean up counter when player leaves
AddEventHandler('playerDropped', function()
    local src = source
    PlayerCounters[src] = nil
end)

print('^2[EXAMPLE-APP] Server callbacks registered^7')
