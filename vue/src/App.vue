<template>
    <div v-if="!ready" class="loading">
        <div class="spinner"></div>
        <p>Loading…</p>
    </div>

    <div v-else class="app-shell">
        <div class="header">
            <h1>Counter</h1>
            <span class="badge">Vue 3</span>
        </div>

        <div class="player-info">
            <div class="label">Phone Number</div>
            <div class="value">{{ player?.phoneNumber || "—" }}</div>
        </div>

        <div class="counter-display">
            <div class="counter-value" :class="{ pulse }">{{ count }}</div>
            <div class="button-group">
                <button class="btn btn-decrement" @click="decrement">−</button>
                <button class="btn btn-increment" @click="increment">+</button>
            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════
             COMPONENTS LIBRARY — globalThis.components.* examples
             ═══════════════════════════════════════════════════════════════ -->
        <div class="section-title">Components Library</div>
        <div class="lib-grid">
            <button class="lib-btn" type="button" @click="examplePopUp">
                <span class="lib-icon">⚠️</span>
                <span class="lib-title">setPopUp</span>
                <span class="lib-sub">Confirm dialog</span>
            </button>
            <button class="lib-btn" type="button" @click="exampleContactSelector">
                <span class="lib-icon">👤</span>
                <span class="lib-title">setContactSelector</span>
                <span class="lib-sub">Pick a contact</span>
            </button>
            <button class="lib-btn" type="button" @click="exampleGallery">
                <span class="lib-icon">🖼️</span>
                <span class="lib-title">setGallery</span>
                <span class="lib-sub">Pick photo(s)</span>
            </button>
            <button class="lib-btn" type="button" @click="exampleEmojiPicker">
                <span class="lib-icon">😀</span>
                <span class="lib-title">setEmojiPickerVisible</span>
                <span class="lib-sub">Pick an emoji</span>
            </button>
            <button class="lib-btn" type="button" @click="exampleNearbyPlayers">
                <span class="lib-icon">📡</span>
                <span class="lib-title">setNearbyPlayers</span>
                <span class="lib-sub">Pick nearby player</span>
            </button>
            <button class="lib-btn" type="button" @click="exampleForm">
                <span class="lib-icon">📝</span>
                <span class="lib-title">setForm</span>
                <span class="lib-sub">Multi-field input</span>
            </button>
            <button class="lib-btn" type="button" @click="examplePaySheet">
                <span class="lib-icon">💳</span>
                <span class="lib-title">setPaySheet</span>
                <span class="lib-sub">Payment confirm</span>
            </button>
        </div>

        <div class="result-panel">
            <div class="result-label">Last result</div>
            <pre>{{ lastResult }}</pre>
        </div>

        <div class="actions">
            <button class="action-btn btn-reset" @click="reset">Reset</button>
            <button class="action-btn btn-notify" @click="onNotify">Notify</button>
            <button class="action-btn btn-close" @click="onClose">Close</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { sendCallback, onInit, notify, close, getComponents } from "./mphone";

const ready = ref(false);
const player = ref(null);
const count = ref(0);
const pulse = ref(false);
const lastResult = ref("— nothing called yet —");

function pulseCounter() {
    pulse.value = true;
    setTimeout(() => (pulse.value = false), 150);
}

async function increment() {
    const r = await sendCallback("increment");
    if (r.success) { count.value = r.count; pulseCounter(); }
}
async function decrement() {
    const r = await sendCallback("decrement");
    if (r.success) { count.value = r.count; pulseCounter(); }
}
async function reset() {
    const r = await sendCallback("reset");
    if (r.success) { count.value = r.count; pulseCounter(); }
}

function onNotify() {
    notify("Counter (Vue)", "Current count: " + count.value);
}

function onClose() {
    close();
}

onInit(async (p) => {
    player.value = p;
    ready.value = true;
    const r = await sendCallback("getCounter");
    if (r.success) count.value = r.count;
});

// ── Components Library handlers ───────────────────────────────────────────
// SDK iframe'e codem-phone tarafından otomatik inject edilir; getComponents()
// standalone modda undefined döner — o zaman butonlar uyarı yazar.
function setResult(label, payload) {
    lastResult.value = "[" + label + "]\n" + JSON.stringify(payload, null, 2);
}

function ensureComponents() {
    const c = getComponents();
    if (!c) {
        lastResult.value = "[error]\n" + JSON.stringify({
            error: "globalThis.components was not injected — is the app running inside the phone?"
        }, null, 2);
        return null;
    }
    return c;
}

async function examplePopUp() {
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
}

async function exampleContactSelector() {
    const c = ensureComponents(); if (!c) return;
    const r = await c.setContactSelector({
        title: "Send to whom?",
        onSelect: (contact) => console.log("[contact] picked:", contact)
    });
    setResult("setContactSelector", r);
}

async function exampleGallery() {
    const c = ensureComponents(); if (!c) return;
    const r = await c.setGallery({
        title: "Pick a photo",
        multiselect: true,
        imageOnly: true,
        maxAmount: 4,
        onSelect: (urls) => console.log("[gallery] selected URLs:", urls)
    });
    setResult("setGallery", r);
}

async function exampleEmojiPicker() {
    const c = ensureComponents(); if (!c) return;
    const r = await c.setEmojiPickerVisible(true, {
        onSelect: (emoji) => console.log("[emoji] picked:", emoji)
    });
    setResult("setEmojiPickerVisible", r);
}

async function exampleNearbyPlayers() {
    const c = ensureComponents(); if (!c) return;
    const r = await c.setNearbyPlayers({
        title: "Pick a player",
        onSelect: (player) => console.log("[nearby] picked:", player)
    });
    setResult("setNearbyPlayers", r);
}

async function exampleForm() {
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
}

async function examplePaySheet() {
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
}
</script>
