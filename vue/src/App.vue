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

        <div class="actions">
            <button class="action-btn btn-reset" @click="reset">Reset</button>
            <button class="action-btn btn-notify" @click="onNotify">Notify</button>
            <button class="action-btn btn-close" @click="onClose">Close</button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { sendCallback, onInit, notify, close } from "./mphone";

const ready = ref(false);
const player = ref(null);
const count = ref(0);
const pulse = ref(false);

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
</script>
