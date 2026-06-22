import { useRef, useState } from "react";
import type { Game } from "../types";
import { SYSTEMS, detectSystem, titleFromFileName } from "../systems";
import { addGame, deleteGame } from "../storage";

interface LibraryProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onChanged: () => void;
}

export function Library({ games, onPlay, onChanged }: LibraryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

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
      skipped.length > 0
        ? `Couldn’t recognise: ${skipped.join(", ")}`
        : null,
    );
    if (inputRef.current) inputRef.current.value = "";
    onChanged();
  }

  async function handleDelete(game: Game) {
    if (!confirm(`Remove “${game.name}” from your library?`)) return;
    await deleteGame(game.id);
    onChanged();
  }

  return (
    <div className="library">
      <header className="library__header">
        <div>
          <h1 className="library__title">easy-emu</h1>
          <p className="library__subtitle">
            NES · Game Boy · SNES · Genesis
          </p>
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

      {games.length === 0 ? (
        <div className="empty">
          <p className="empty__line">Your library is empty.</p>
          <p className="empty__hint">
            Tap <strong>Add game</strong> and pick a ROM file you legally own
            (<code>.nes .gb .gbc .smc .sfc .md .gen .bin</code>).
          </p>
        </div>
      ) : (
        <ul className="grid">
          {games.map((game) => {
            const sys = SYSTEMS[game.system];
            return (
              <li key={game.id} className="card">
                <button
                  className="card__face"
                  style={{ borderColor: sys.color }}
                  onClick={() => onPlay(game)}
                >
                  <span
                    className="card__tag"
                    style={{ background: sys.color }}
                  >
                    {sys.tag}
                  </span>
                  <span className="card__name">{game.name}</span>
                </button>
                <button
                  className="card__delete"
                  aria-label={`Remove ${game.name}`}
                  onClick={() => handleDelete(game)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="library__footer">
        easy-emu ships no games. Use only ROMs you are legally entitled to
        play.
      </footer>
    </div>
  );
}
