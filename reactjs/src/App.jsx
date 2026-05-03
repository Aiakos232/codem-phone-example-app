import React, { useEffect, useState, useCallback } from "react";
import { sendCallback, onInit, notify, close, getComponents } from "./mphone";

export default function App() {
    const [ready, setReady] = useState(false);
    const [player, setPlayer] = useState(null);
    const [count, setCount] = useState(0);
    const [pulse, setPulse] = useState(false);
    const [lastResult, setLastResult] = useState("— nothing called yet —");

    const pulseCounter = useCallback(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 150);
    }, []);

    const apply = useCallback((r) => {
        if (r?.success) {
            setCount(r.count);
            pulseCounter();
        }
    }, [pulseCounter]);

    const increment = useCallback(async () => apply(await sendCallback("increment")), [apply]);
    const decrement = useCallback(async () => apply(await sendCallback("decrement")), [apply]);
    const reset = useCallback(async () => apply(await sendCallback("reset")), [apply]);

    const onNotify = useCallback(() => {
        notify("Counter (React)", "Current count: " + count);
    }, [count]);

    useEffect(() => {
        onInit(async (p) => {
            setPlayer(p);
            setReady(true);
            const r = await sendCallback("getCounter");
            if (r?.success) setCount(r.count);
        });
    }, []);

    // ── Components Library handlers ───────────────────────────────────────
    // SDK iframe'e codem-phone tarafından otomatik inject edilir; getComponents()
    // standalone modda undefined döner — o zaman butonlar uyarı yazar.
    const setResult = (label, payload) => {
        setLastResult("[" + label + "]\n" + JSON.stringify(payload, null, 2));
    };

    const ensureComponents = () => {
        const c = getComponents();
        if (!c) {
            setLastResult("[error]\n" + JSON.stringify({
                error: "globalThis.components was not injected — is the app running inside the phone?"
            }, null, 2));
            return null;
        }
        return c;
    };

    const examplePopUp = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setPopUp({
            title: "Reset phone?",
            description: "All your data will be wiped. This cannot be undone.",
            buttons: [
                { title: "Cancel",   color: "red",  cb: () => console.log("[popup] cancelled") },
                { title: "Continue", color: "blue", cb: () => console.log("[popup] confirmed") }
            ]
        });
        setResult("setPopUp", r);
    }, []);

    const exampleContactSelector = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setContactSelector({
            title: "Send to whom?",
            onSelect: (contact) => console.log("[contact] picked:", contact)
        });
        setResult("setContactSelector", r);
    }, []);

    const exampleGallery = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setGallery({
            title: "Pick a photo",
            multiselect: true,
            imageOnly: true,
            maxAmount: 4,
            onSelect: (urls) => console.log("[gallery] selected URLs:", urls)
        });
        setResult("setGallery", r);
    }, []);

    const exampleEmojiPicker = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setEmojiPickerVisible(true, {
            onSelect: (emoji) => console.log("[emoji] picked:", emoji)
        });
        setResult("setEmojiPickerVisible", r);
    }, []);

    const exampleNearbyPlayers = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setNearbyPlayers({
            title: "Pick a player",
            onSelect: (player) => console.log("[nearby] picked:", player)
        });
        setResult("setNearbyPlayers", r);
    }, []);

    const exampleForm = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setForm({
            title: "Add New Contact",
            description: "Fill in the details to add a phonebook entry.",
            confirmText: "Add",
            fields: [
                { placeholder: "Full name", value: "", type: "text" },
                { placeholder: "Phone",     value: "", type: "number" }
            ],
            interval: { hours: "08", minutes: "30", label: "Reminder", suffix: "hours" },
            onConfirm: (fields, interval) => console.log("[form] submitted:", fields, "interval:", interval)
        });
        setResult("setForm", r);
    }, []);

    const examplePaySheet = useCallback(async () => {
        const c = ensureComponents(); if (!c) return;
        const r = await c.setPaySheet({
            title: "Cart checkout",
            accountName: "Aiakos Bank — **** 4832",
            fromLabel: "Pay from account",
            confirmLabel: "Pay now",
            items: [
                { label: "Premium membership",   amount: 49.90 },
                { label: "Extra storage (50GB)", amount: 19.90 },
                { label: "Discount",             amount: -9.80 }
            ],
            onConfirm: (r) => console.log("[pay] confirmed, total:", r.total),
            onCancel:  ()  => console.log("[pay] cancelled")
        });
        setResult("setPaySheet", r);
    }, []);

    if (!ready) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <p>Loading…</p>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <div className="header">
                <h1>Counter</h1>
                <span className="badge">React</span>
            </div>

            <div className="player-info">
                <div className="label">Phone Number</div>
                <div className="value">{player?.phoneNumber || "—"}</div>
            </div>

            <div className="counter-display">
                <div className={"counter-value" + (pulse ? " pulse" : "")}>{count}</div>
                <div className="button-group">
                    <button className="btn btn-decrement" onClick={decrement}>−</button>
                    <button className="btn btn-increment" onClick={increment}>+</button>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                COMPONENTS LIBRARY — globalThis.components.* examples
                ═══════════════════════════════════════════════════════════════ */}
            <div className="section-title">Components Library</div>
            <div className="lib-grid">
                <button className="lib-btn" type="button" onClick={examplePopUp}>
                    <span className="lib-icon">⚠️</span>
                    <span className="lib-title">setPopUp</span>
                    <span className="lib-sub">Confirm dialog</span>
                </button>
                <button className="lib-btn" type="button" onClick={exampleContactSelector}>
                    <span className="lib-icon">👤</span>
                    <span className="lib-title">setContactSelector</span>
                    <span className="lib-sub">Pick a contact</span>
                </button>
                <button className="lib-btn" type="button" onClick={exampleGallery}>
                    <span className="lib-icon">🖼️</span>
                    <span className="lib-title">setGallery</span>
                    <span className="lib-sub">Pick photo(s)</span>
                </button>
                <button className="lib-btn" type="button" onClick={exampleEmojiPicker}>
                    <span className="lib-icon">😀</span>
                    <span className="lib-title">setEmojiPickerVisible</span>
                    <span className="lib-sub">Pick an emoji</span>
                </button>
                <button className="lib-btn" type="button" onClick={exampleNearbyPlayers}>
                    <span className="lib-icon">📡</span>
                    <span className="lib-title">setNearbyPlayers</span>
                    <span className="lib-sub">Pick nearby player</span>
                </button>
                <button className="lib-btn" type="button" onClick={exampleForm}>
                    <span className="lib-icon">📝</span>
                    <span className="lib-title">setForm</span>
                    <span className="lib-sub">Multi-field input</span>
                </button>
                <button className="lib-btn" type="button" onClick={examplePaySheet}>
                    <span className="lib-icon">💳</span>
                    <span className="lib-title">setPaySheet</span>
                    <span className="lib-sub">Payment confirm</span>
                </button>
            </div>

            <div className="result-panel">
                <div className="result-label">Last result</div>
                <pre>{lastResult}</pre>
            </div>

            <div className="actions">
                <button className="action-btn btn-reset" onClick={reset}>Reset</button>
                <button className="action-btn btn-notify" onClick={onNotify}>Notify</button>
                <button className="action-btn btn-close" onClick={close}>Close</button>
            </div>
        </div>
    );
}
