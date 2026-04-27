// ════════════════════════════════════════════════════════════════════════════
// codem-phone iframe bridge — mphone:* postMessage protocol wrapper.
// Reusable across all custom apps; not tied to Vue specifically.
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

/**
 * Server (or client) tarafına callback gönder, response Promise olarak döner.
 * @param {string} action  Server'ın dinlediği event adı (codem-phone:customApp:{id}:{action}).
 * @param {object} payload Veri.
 * @param {boolean} toServer  true → server event, false → client event.
 */
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

/**
 * mphone:init mesajını dinler ve player bilgisini callback'e gönderir.
 * @param {(player: object) => void} cb
 */
export function onInit(cb) {
    window.addEventListener("message", (event) => {
        if (event.data?.type === "mphone:init") {
            cb(event.data.player || {});
        }
    });
}

/**
 * Telefonun notification banner'ında bir mesaj göster.
 */
export function notify(header, message) {
    window.parent.postMessage({
        type: "mphone:notification",
        header,
        message,
    }, "*");
}

/**
 * App'i kapat (telefon home'a döner).
 */
export function close() {
    window.parent.postMessage({ type: "mphone:close" }, "*");
}

/**
 * GTA dünyasında waypoint koy.
 */
export function setWaypoint(x, y) {
    window.parent.postMessage({ type: "mphone:waypoint", x, y }, "*");
}
