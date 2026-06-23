import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

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
