-- ════════════════════════════════════════════════════════════════════════════
-- Example Custom Phone App (React TS) — Server Side
-- ════════════════════════════════════════════════════════════════════════════

local PlayerCounters = {}

AddEventHandler('codem-phone:customApp:example-counter-react-ts:getCounter', function(source, _payload, cb)
    cb({ success = true, count = PlayerCounters[source] or 0 })
end)

AddEventHandler('codem-phone:customApp:example-counter-react-ts:increment', function(source, _payload, cb)
    PlayerCounters[source] = (PlayerCounters[source] or 0) + 1
    cb({ success = true, count = PlayerCounters[source] })
end)

AddEventHandler('codem-phone:customApp:example-counter-react-ts:decrement', function(source, _payload, cb)
    PlayerCounters[source] = math.max(0, (PlayerCounters[source] or 0) - 1)
    cb({ success = true, count = PlayerCounters[source] })
end)

AddEventHandler('codem-phone:customApp:example-counter-react-ts:reset', function(source, _payload, cb)
    PlayerCounters[source] = 0
    cb({ success = true, count = 0 })
end)

AddEventHandler('playerDropped', function()
    PlayerCounters[source] = nil
end)

print('^2[EXAMPLE-REACT-TS] Server callbacks registered^7')
