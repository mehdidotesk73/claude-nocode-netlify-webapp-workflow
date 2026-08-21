<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import HelpModal from './components/HelpModal.vue'
import { debugState, logDebug } from './debug'
import { reloadLatest } from './pwa'

const buildId = __BUILD_ID__
const buildTime = __BUILD_TIME__
const showDebug = ref(false)
const copied = ref(false)

// Update available affordance: show when new build is live
const showUpdatePanel = ref(false)
const updateSlot = ref<HTMLElement>()
const updateAvailable = ref(false)

function onDocClickUpdate(e: MouseEvent) {
  if (showUpdatePanel.value && updateSlot.value && !updateSlot.value.contains(e.target as Node)) {
    showUpdatePanel.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClickUpdate))
onBeforeUnmount(() => document.removeEventListener('click', onDocClickUpdate))

// Copy log buffer for debugging
async function copyLog() {
  const text = [
    `build ${buildId} · ${buildTime}`,
    ...debugState.logs.map((l) => `${l.time} [${l.kind}] ${l.msg}`),
  ].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    logDebug('clipboard copy failed', 'error')
  }
}

// Reload to latest build
async function onReloadLatest() {
  logDebug('Reloading to latest build...')
  await reloadLatest()
}

// Help modal state
const showHelp = ref(false)
const helpDoc = ref('default')

// Simulate update detection (in real app, useVersionCheck() would do this)
onMounted(() => {
  // Example: check for update after 5 seconds
  setTimeout(() => {
    // Set updateAvailable = true if new version detected
    // For now, it stays false until you implement version checking
  }, 5000)
})
</script>

<template>
  <main class="app">
    <header>
      <div class="title-row">
        <div class="update-slot" ref="updateSlot">
          <button
            v-if="updateAvailable"
            class="update-btn"
            @click="showUpdatePanel = !showUpdatePanel"
          >
            Update available
          </button>
          <div
            v-if="showUpdatePanel && updateAvailable"
            class="update-pop"
            role="dialog"
          >
            <div class="up-line">build {{ buildId }}</div>
            <button class="reload-btn update-ready" @click="onReloadLatest">
              Update ready — Reload
            </button>
          </div>
        </div>
        <h1 class="app-title">App Name</h1>
        <button class="help-btn" @click="showHelp = true" aria-label="Help" title="Help">
          ? Help
        </button>
      </div>
    </header>

    <!-- TODO: Your app content goes here -->
    <div class="content">
      <p>Welcome! Replace this with your app content.</p>
      <p>Start by customizing the references in CLAUDE.md and describing what you want to build.</p>
    </div>

    <footer class="debug">
      <button class="debug-toggle" @click="showDebug = !showDebug">
        build {{ buildId }}
        <span v-if="debugState.logs.some((l) => l.kind === 'error')" class="err-dot">
          ● {{ debugState.logs.filter((l) => l.kind === 'error').length }} error(s)
        </span>
        <span class="chev">{{ showDebug ? '▲' : '▼' }}</span>
      </button>
      <button
        class="reload-btn"
        :class="{ 'update-ready': updateAvailable }"
        @click="onReloadLatest"
      >
        {{ updateAvailable ? 'Update ready — Reload' : 'Reload latest' }}
      </button>
      <button v-if="showDebug" class="reload-btn" @click="copyLog">
        {{ copied ? 'Copied ✓' : 'Copy log' }}
      </button>
      <ul v-if="showDebug" class="debug-log">
        <li v-if="!debugState.logs.length" class="muted">No log entries yet.</li>
        <li v-for="(l, i) in debugState.logs" :key="i" :class="l.kind">
          <span class="muted">{{ l.time }}</span> {{ l.msg }}
        </li>
      </ul>
    </footer>

    <HelpModal :open="showHelp" :initial-doc="helpDoc" @close="showHelp = false" />
  </main>
</template>

<style scoped>
.app {
  max-width: 60rem;
  margin: 0 auto;
  padding: max(1rem, env(safe-area-inset-top)) 1rem 2rem;
}

.title-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.app-title {
  grid-column: 2;
  justify-self: center;
  margin: 0;
  font-size: clamp(1.05rem, 4vw, 1.5rem);
  line-height: 1.1;
  white-space: nowrap;
}

.update-slot {
  grid-column: 1;
  justify-self: start;
  align-self: start;
  position: relative;
}

.update-btn {
  background: var(--bg-elev-2);
  border: 1px solid var(--accent-blue);
  color: var(--text);
  font-weight: 600;
  font-size: 0.78rem;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  cursor: pointer;
  white-space: nowrap;
}

.update-btn:hover {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: #fff;
}

.update-pop {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 70;
  width: max-content;
  max-width: min(18rem, calc(100vw - 1rem));
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem;
  background: var(--bg-elev);
  border: 1px solid var(--accent-blue);
  border-radius: 0.4rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.up-line {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.help-btn {
  grid-column: 3;
  justify-self: end;
  align-self: start;
  background: var(--bg-elev-2, transparent);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.78rem;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  cursor: pointer;
}

.help-btn:hover {
  color: var(--text);
  border-color: var(--accent-blue);
}

.content {
  padding: 1rem 0;
}

.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 0.85rem;
}

.debug {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border);
  padding-top: 0.5rem;
}

.debug-toggle {
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.72rem;
  padding: 0.2rem 0;
  cursor: pointer;
}

.debug-toggle:hover {
  color: var(--text);
}

.err-dot {
  color: var(--danger);
  margin-left: 0.4rem;
}

.reload-btn {
  margin-left: 0.6rem;
  font-size: 0.72rem;
  padding: 0.15rem 0.5rem;
  background: var(--bg-elev-2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 0.4rem;
  cursor: pointer;
}

.reload-btn.update-ready {
  border-color: var(--accent-blue);
  color: var(--text);
  font-weight: 600;
}

.chev {
  margin-left: 0.3rem;
}

.debug-log {
  list-style: none;
  padding: 0.5rem;
  margin: 0.4rem 0 0;
  background: #060912;
  color: #cdd3e0;
  border: 1px solid var(--border);
  border-radius: 0.4rem;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  line-height: 1.5;
  max-height: 12rem;
  overflow: auto;
}

.debug-log .error {
  color: var(--danger);
}

.debug-log .warn {
  color: #ff9800;
}
</style>
