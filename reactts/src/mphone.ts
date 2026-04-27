// ════════════════════════════════════════════════════════════════════════════
// codem-phone iframe bridge — mphone:* postMessage protocol wrapper.
// Reusable across all custom apps; not tied to React specifically.
// ════════════════════════════════════════════════════════════════════════════

export interface PlayerInfo {
    phoneNumber?: string;
    identifier?: string;
    name?: string;
    serverId?: number;
}

export interface CallbackResult<T = unknown> {
    success: boolean;
    error?: string;
    [key: string]: unknown;
    data?: T;
}

const pendingCallbacks: Record<string, (result: CallbackResult) => void> = {};

function generateCallbackId(): string {
    return "cb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

window.addEventListener("message", (event: MessageEvent) => {
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

export function sendCallback<T = unknown>(
    action: string,
    payload: object = {},
    toServer = true
): Promise<CallbackResult<T>> {
    return new Promise((resolve) => {
        const id = generateCallbackId();
        pendingCallbacks[id] = resolve as (r: CallbackResult) => void;
        window.parent.postMessage({
            type: "mphone:callback",
            action,
            payload,
            callbackId: id,
            server: toServer,
        }, "*");
        setTimeout(() => {
            if (pendingCallbacks[id]) {
                resolve({ success: false, error: "Timeout" } as CallbackResult<T>);
                delete pendingCallbacks[id];
            }
        }, 10000);
    });
}

export function onInit(cb: (player: PlayerInfo) => void): void {
    window.addEventListener("message", (event: MessageEvent) => {
        if (event.data?.type === "mphone:init") {
            cb(event.data.player || {});
        }
    });
}

export function notify(header: string, message: string): void {
    window.parent.postMessage({
        type: "mphone:notification",
        header,
        message,
    }, "*");
}

export function close(): void {
    window.parent.postMessage({ type: "mphone:close" }, "*");
}

export function setWaypoint(x: number, y: number): void {
    window.parent.postMessage({ type: "mphone:waypoint", x, y }, "*");
}
