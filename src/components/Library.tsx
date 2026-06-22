import { useMemo, useRef, useState } from "react";
import type { Game } from "../types";
import { SYSTEMS, detectSystem, titleFromFileName } from "../systems";
import { addGame, deleteGame, setFavorite } from "../storage";
import { DEBUG_ENABLED, clearDiag, readDiag } from "../diag";

interface LibraryProps {
  games: Game[];
  savedIds: Set<string>;
  onPlay: (game: Game) => void;
  onResume: (game: Game) => void;
  onChanged: () => void;
}

type Filter = "all" | "favorites" | "recents";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "favorites", label: "★ Favorites" },
  { id: "recents", label: "Recents" },
];

const EMPTY_MESSAGE: Record<Filter, string> = {
  all: "Your library is empty.",
  favorites: "No favorites yet. Tap the ☆ on a game to add it.",
  recents: "Nothing played yet. Pick a game to get started.",
};

export function Library({
  games,
  savedIds,
  onPlay,
  onResume,
  onChanged,
}: LibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [diag, setDiag] = useState<string[]>(() => readDiag());

  const visible = useMemo(() => {
    if (filter === "favorites") {
      return games.filter((g) => g.favorite);
    }
    if (filter === "recents") {
      return games
        .filter((g) => g.lastPlayedAt)
        .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0));
    }
    return games; // "all" — already newest-added first
  }, [games, filter]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const skipped: string[] = [];

    for (const file of Array.from(files)) {
      const system = detectSystem(file.name);
      if (!system) {
        skipped.push(file.name);
        continue;
      }
      const game: Game = {
        id: crypto.randomUUID(),
        name: titleFromFileName(file.name),
        system,
        fileName: file.name,
        data: file,
        addedAt: Date.now(),
      };
      await addGame(game);
    }

    setImportError(
      skipped.length > 0 ? `Couldn’t recognise: ${skipped.join(", ")}` : null,
    );
    if (inputRef.current) inputRef.current.value = "";
    onChanged();
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Remove “${game.name}” from your library?`)) return;
    await deleteGame(game.id);
    onChanged();
  }

  async function handleToggleFavorite(game: Game) {
    await setFavorite(game.id, !game.favorite);
    onChanged();
  }

  return (
    <div className="library">
      <header className="library__header">
        <div>
          <h1 className="library__title">easy-emu</h1>
          <p className="library__subtitle">NES · Game Boy · SNES · Genesis</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => inputRef.current?.click()}
        >
          + Add game
        </button>
        {/* No `accept` filter on purpose: ROM extensions have no registered
            MIME type, so iOS Safari's Files picker greys them out if we set
            one. We let the user pick any file and validate the extension in
            handleFiles instead. */}
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </header>

      {importError && <p className="library__error">{importError}</p>}

      {DEBUG_ENABLED && (
        <section className="diag">
          <div className="diag__head">
            <strong>Diagnostics</strong>
            <button
              className="btn btn--ghost"
              onClick={() => {
                clearDiag();
                setDiag([]);
              }}
            >
              Clear
            </button>
          </div>
          <pre className="diag__log">
            {diag.length ? diag.join("\n") : "(nothing recorded yet)"}
          </pre>
        </section>
      )}

      {games.length > 0 && (
        <nav className="filters" aria-label="Filter games">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`chip${filter === f.id ? " chip--active" : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </nav>
      )}

      {games.length === 0 ? (
        <div className="empty">
          <p className="empty__line">Your library is empty.</p>
          <p className="empty__hint">
            Tap <strong>Add game</strong> and pick a ROM file you legally own
            (<code>.nes .gb .gbc .smc .sfc .md .gen .bin</code>).
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p className="empty__line">{EMPTY_MESSAGE[filter]}</p>
        </div>
      ) : (
        <ul className="rom-list">
          {visible.map((game) => {
            const sys = SYSTEMS[game.system];
            const hasSave = savedIds.has(game.id);
            const fav = !!game.favorite;
            return (
              <li key={game.id} className="rom">
                <div className="rom__surface">
                  <button className="rom__main" onClick={() => onPlay(game)}>
                    <span className="rom__tag" style={{ background: sys.color }}>
                      {sys.tag}
                    </span>
                    <span className="rom__name">{game.name}</span>
                    {hasSave && <span className="rom__saved">● saved</span>}
                  </button>
                  <div className="rom__actions">
                    <button
                      className={`rom__fav${fav ? " rom__fav--on" : ""}`}
                      aria-pressed={fav}
                      aria-label={
                        fav ? "Remove from favorites" : "Add to favorites"
                      }
                      onClick={() => handleToggleFavorite(game)}
                    >
                      {fav ? "★" : "☆"}
                    </button>
                    {hasSave && (
                      <button
                        className="rom__resume"
                        onClick={() => onResume(game)}
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
                {/* Revealed by swiping the row left (native scroll-snap). */}
                <button
                  className="rom__delete"
                  aria-label={`Delete ${game.name}`}
                  onClick={() => handleDelete(game)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="library__footer">
        easy-emu ships no games. Use only ROMs you are legally entitled to play.
      </footer>
    </div>
  );
}
