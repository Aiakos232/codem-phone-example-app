// ════════════════════════════════════════════════════════════════════════════
// codem-phone iframe bridge — mphone:* postMessage protocol wrapper.
// Reusable across all custom apps; not tied to React specifically.
// ════════════════════════════════════════════════════════════════════════════

const pendingCallbacks = {};

function generateCallbackId() {
    return "cb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || !data.type) return;
    if (data.type === "mphone:callback:response") {
        const cb = pendingCallbacks[data.callbackId];
        if (cb) {
            cb(data.result);
            delete pendingCallbacks[data.callbackId];
        }
    }
});

export function sendCallback(action, payload, toServer = true) {
    return new Promise((resolve) => {
        const id = generateCallbackId();
        pendingCallbacks[id] = resolve;
        window.parent.postMessage({
            type: "mphone:callback",
            action,
            payload: payload || {},
            callbackId: id,
            server: toServer,
        }, "*");
        setTimeout(() => {
            if (pendingCallbacks[id]) {
                resolve({ success: false, error: "Timeout" });
                delete pendingCallbacks[id];
            }
        }, 10000);
    });
}

export function onInit(cb) {
    window.addEventListener("message", (event) => {
        if (event.data?.type === "mphone:init") {
            cb(event.data.player || {});
        }
    });
}

export function notify(header, message) {
    window.parent.postMessage({
        type: "mphone:notification",
        header,
        message,
    }, "*");
}

export function close() {
    window.parent.postMessage({ type: "mphone:close" }, "*");
}

export function setWaypoint(x, y) {
    window.parent.postMessage({ type: "mphone:waypoint", x, y }, "*");
}
