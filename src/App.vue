<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import HelpModal from './components/HelpModal.vue'
import { debugState, logDebug, logAsText } from './debug'
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

const errorCount = computed(() => debugState.logs.filter((l) => l.kind === 'error').length)

// Copy the log so the user can paste it back to Claude. This is the only
// channel from a phone with no console, so it gets a fallback: clipboard.*
// needs a secure context, and a silent failure here loses the whole report.
async function copyLog() {
  const text = logAsText(buildId, buildTime)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length) // iOS ignores select() alone
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (!ok) {
      logDebug('Could not copy automatically — select the log text and copy it by hand.', 'warn')
      return
    }
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
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
      <div class="debug-bar">
        <span class="build-stamp">build {{ buildId }}</span>

        <button
          class="reload-btn logs-btn"
          :class="{ 'has-errors': errorCount > 0 }"
          @click="showDebug = !showDebug"
        >
          {{ showDebug ? 'Hide logs' : 'View logs' }}
          <span v-if="errorCount" class="err-count">{{ errorCount }}</span>
        </button>

        <button
          class="reload-btn"
          :class="{ 'update-ready': updateAvailable }"
          @click="onReloadLatest"
        >
          {{ updateAvailable ? 'Update ready — Reload' : 'Reload latest' }}
        </button>
      </div>

      <div v-if="showDebug" class="log-window">
        <div class="log-head">
          <span class="muted">
            {{ debugState.logs.length }} {{ debugState.logs.length === 1 ? 'entry' : 'entries' }}
          </span>
          <button class="reload-btn" @click="copyLog">
            {{ copied ? 'Copied ✓' : 'Copy log' }}
          </button>
        </div>
        <p class="log-hint muted">
          Something not working? Tap <strong>Copy log</strong> and paste it to Claude.
        </p>
        <ul class="debug-log">
          <li v-if="!debugState.logs.length" class="muted">No log entries yet.</li>
          <li v-for="(l, i) in debugState.logs" :key="i" :class="l.kind">
            <span class="muted">{{ l.time }}</span> {{ l.msg
            }}<span v-if="l.count > 1" class="repeat">×{{ l.count }}</span>
          </li>
        </ul>
      </div>
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

.debug-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.build-stamp {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin-right: auto;
}

/* An error the user can't notice is an error they won't report — so the
   button that opens the log carries the count, in the danger colour. */
.logs-btn.has-errors {
  border-color: var(--danger);
  color: var(--danger);
  font-weight: 600;
}

.err-count {
  display: inline-block;
  min-width: 1.05rem;
  margin-left: 0.3rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 0.65rem;
  line-height: 1.05rem;
  text-align: center;
}

.log-window {
  margin-top: 0.5rem;
}

.log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.log-hint {
  margin: 0.25rem 0 0;
  font-size: 0.7rem;
}

.repeat {
  margin-left: 0.35rem;
  opacity: 0.65;
}

.reload-btn {
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
