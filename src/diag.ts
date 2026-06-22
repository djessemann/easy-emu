/**
 * Tiny diagnostics buffer. We can't attach a desktop debugger to an iOS
 * Home-Screen app, so we record the recent sequence of lifecycle events
 * (errors, page reloads, service-worker takeovers, messages from the emulator
 * frame) into sessionStorage, which survives a reload within the same tab.
 *
 * Nothing is shown to normal users; append `?debug` to the URL to view the log
 * in the library. This is how we tell *why* a session reloaded.
 */
const KEY = "easyemu:diag";
const MAX = 20;

export function logDiag(entry: string): void {
  try {
    const prev = readDiag();
    const stamp = new Date().toISOString().slice(11, 23);
    prev.push(`${stamp}  ${entry}`);
    sessionStorage.setItem(KEY, JSON.stringify(prev.slice(-MAX)));
  } catch {
    /* sessionStorage unavailable — diagnostics are best-effort */
  }
}

export function readDiag(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function clearDiag(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const DEBUG_ENABLED = (() => {
  try {
    return new URLSearchParams(location.search).has("debug");
  } catch {
    return false;
  }
})();
