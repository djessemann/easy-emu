import { useCallback, useEffect, useState } from "react";
import type { Game } from "./types";
import { listGames } from "./storage";
import { Library } from "./components/Library";
import { Player } from "./components/Player";

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [playing, setPlaying] = useState<Game | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setGames(await listGames());
    setLoaded(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Exiting a game reloads the app: EmulatorJS can't be torn down reliably in
  // place, and a reload back to the (IndexedDB-backed) library is instant.
  const handleExit = useCallback(() => {
    window.location.reload();
  }, []);

  if (playing) {
    return <Player game={playing} onExit={handleExit} />;
  }

  if (!loaded) {
    return <div className="boot">Loading…</div>;
  }

  return <Library games={games} onPlay={setPlaying} onChanged={refresh} />;
}
