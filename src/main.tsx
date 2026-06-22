import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { logDiag } from "./diag";
import "./styles.css";

// Record the lifecycle events that would explain an unexpected reload. These
// land in sessionStorage (which survives a reload) so we can read the sequence
// after the fact via ?debug — see src/diag.ts.
window.addEventListener("error", (e) => logDiag(`window error: ${e.message}`));
window.addEventListener("unhandledrejection", (e) =>
  logDiag(`unhandled rejection: ${String((e as PromiseRejectionEvent).reason)}`),
);
window.addEventListener("pagehide", (e) =>
  logDiag(`pagehide (bfcache=${(e as PageTransitionEvent).persisted})`),
);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () =>
    logDiag("serviceworker controllerchange (new SW took control)"),
  );
}
logDiag("app boot");

/**
 * Catches render-time errors so a failure shows a readable message and a way
 * to recover instead of a blank white screen.
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal">
          <h1>Something went wrong</h1>
          <pre className="fatal__msg">{String(this.state.error?.message)}</pre>
          <button className="btn btn--primary" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
