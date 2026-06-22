import { useCallback, useEffect, useState } from "react";
import type { Game } from "./types";
import { listGames, listStateIds, markPlayed } from "./storage";
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

  // Exiting a game just drops back to the library. The emulator runs inside an
  // iframe (see Player), so unmounting it tears the whole session down cleanly
  // — no full-page reload, which is what was leaving iOS Safari on a blank tab.
  const handleExit = useCallback(() => {
    setLaunch(null);
    void refresh();
  }, [refresh]);

  // Launch a game and stamp it as recently played (drives the Recents filter).
  const launchGame = useCallback((game: Game, autoLoad: boolean) => {
    void markPlayed(game.id);
    setLaunch({ game, autoLoad });
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
      onPlay={(game) => launchGame(game, false)}
      onResume={(game) => launchGame(game, true)}
      onChanged={refresh}
    />
  );
}
