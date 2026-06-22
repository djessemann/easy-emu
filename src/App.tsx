import { useCallback, useEffect, useState } from "react";
import type { Game } from "./types";
import { listGames, listStateIds } from "./storage";
import { Library } from "./components/Library";
import { Player } from "./components/Player";

interface Launch {
  game: Game;
  autoLoad: boolean;
}

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const [g, ids] = await Promise.all([listGames(), listStateIds()]);
    setGames(g);
    setSavedIds(new Set(ids));
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

  if (launch) {
    return (
      <Player
        game={launch.game}
        autoLoad={launch.autoLoad}
        onExit={handleExit}
      />
    );
  }

  if (!loaded) {
    return <div className="boot">Loading…</div>;
  }

  return (
    <Library
      games={games}
      savedIds={savedIds}
      onPlay={(game) => setLaunch({ game, autoLoad: false })}
      onResume={(game) => setLaunch({ game, autoLoad: true })}
      onChanged={refresh}
    />
  );
}
