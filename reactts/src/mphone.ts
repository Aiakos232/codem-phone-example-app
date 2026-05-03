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

// ════════════════════════════════════════════════════════════════════════════
// Components API — codem-phone'un built-in dialog/sheet bileşenleri.
// SDK iframe içine otomatik inject edilir (globalThis.components); burada
// sadece TypeScript için tipleri expose ediyoruz + güvenli erişim helper'ı.
// ════════════════════════════════════════════════════════════════════════════

export interface PopUpButton {
    title: string;
    color?: "red" | "blue" | "green" | "yellow" | string;
    cb?: () => void;
}
export interface PopUpOptions {
    title?: string;
    description?: string;
    buttons?: PopUpButton[];
}
export interface PopUpResult {
    confirmed: boolean;
    buttonIndex: number;
    cancelled?: boolean;
}

export interface ContactSelectorOptions {
    title?: string;
    onSelect?: (contact: { name: string; phone?: string }) => void;
    onClose?: () => void;
}
export interface ContactSelectorResult {
    cancelled: boolean;
    contact?: { name: string; phone?: string };
}

export interface GalleryOptions {
    title?: string;
    multiselect?: boolean;
    imageOnly?: boolean;
    videoOnly?: boolean;
    maxAmount?: number;
    initialSelected?: string[];
    onSelect?: (urls: string | string[]) => void;
    onClose?: () => void;
}
export interface GalleryResult {
    cancelled: boolean;
    url?: string;
    urls?: string[];
}

export interface EmojiPickerOptions {
    title?: string;
    onSelect?: (emoji: string) => void;
    onClose?: () => void;
}
export interface EmojiPickerResult {
    cancelled: boolean;
    emoji?: string;
}

export interface NearbyPlayer {
    id?: number;
    name: string;
    color?: string;
    avatar?: string;
}
export interface NearbyPlayersOptions {
    title?: string;
    onSelect?: (player: NearbyPlayer) => void;
    onClose?: () => void;
}
export interface NearbyPlayersResult {
    cancelled: boolean;
    player?: NearbyPlayer;
}

export interface FormFieldDef {
    placeholder: string;
    value?: string;
    type?: "text" | "number" | "password" | string;
}
export interface FormIntervalDef {
    hours?: string;
    minutes?: string;
    label?: string;
    suffix?: string;
}
export interface FormOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    fields?: FormFieldDef[];
    interval?: FormIntervalDef | null;
    onConfirm?: (fields: string[], interval?: { hours: string; minutes: string }) => void;
    onCancel?: () => void;
}
export interface FormResult {
    cancelled: boolean;
    fields?: string[];
    interval?: { hours: string; minutes: string };
}

export interface PaySheetItem {
    label: string;
    amount: number;
}
export interface PaySheetOptions {
    title?: string;
    accountName?: string;
    fromLabel?: string;
    confirmLabel?: string;
    items: PaySheetItem[];
    onConfirm?: (result: PaySheetResult) => void;
    onCancel?: () => void;
}
export interface PaySheetResult {
    cancelled: boolean;
    confirmed: boolean;
    total: number;
}

export type ComponentName =
    | "popUp"
    | "contactSelector"
    | "gallery"
    | "emojiPicker"
    | "nearbyPlayers"
    | "form"
    | "paySheet";

export interface Components {
    setPopUp: (opts: PopUpOptions) => Promise<PopUpResult>;
    setContactSelector: (opts?: ContactSelectorOptions) => Promise<ContactSelectorResult>;
    setGallery: (opts?: GalleryOptions) => Promise<GalleryResult>;
    setEmojiPickerVisible: (visible: boolean, opts?: EmojiPickerOptions) => Promise<EmojiPickerResult>;
    setNearbyPlayers: (opts?: NearbyPlayersOptions) => Promise<NearbyPlayersResult>;
    setForm: (opts: FormOptions) => Promise<FormResult>;
    setPaySheet: (opts: PaySheetOptions) => Promise<PaySheetResult>;
    close: (which?: ComponentName) => void;
}

declare global {
    interface Window {
        components?: Components;
    }
}

/**
 * Get the auto-injected Components SDK. Returns `undefined` if the app is
 * running outside the phone (e.g. standalone Vite dev server / file://),
 * in which case all calls should be skipped.
 */
export function getComponents(): Components | undefined {
    return typeof window !== "undefined" ? window.components : undefined;
}
