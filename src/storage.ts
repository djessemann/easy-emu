import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game } from "./types";

interface SaveStateRecord {
  gameId: string;
  data: Blob;
  updatedAt: number;
}

interface EasyEmuDB extends DBSchema {
  games: {
    key: string;
    value: Game;
    indexes: { addedAt: number };
  };
  states: {
    key: string;
    value: SaveStateRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<EasyEmuDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<EasyEmuDB>("easy-emu", 2, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          const store = database.createObjectStore("games", { keyPath: "id" });
          store.createIndex("addedAt", "addedAt");
        }
        if (oldVersion < 2) {
          database.createObjectStore("states", { keyPath: "gameId" });
        }
      },
    });
  }
  return dbPromise;
}

/* ---- games ---- */

export async function listGames(): Promise<Game[]> {
  const all = await (await db()).getAllFromIndex("games", "addedAt");
  return all.reverse(); // newest first
}

export async function addGame(game: Game): Promise<void> {
  await (await db()).put("games", game);
}

export async function deleteGame(id: string): Promise<void> {
  const database = await db();
  await database.delete("games", id);
  await database.delete("states", id); // drop its save state too
}

export async function getGame(id: string): Promise<Game | undefined> {
  return (await db()).get("games", id);
}

/** Star / unstar a game (Favorites filter). No-op if the game is gone. */
export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const database = await db();
  const game = await database.get("games", id);
  if (!game) return;
  await database.put("games", { ...game, favorite });
}

/** Record that a game was just launched (Recents filter). */
export async function markPlayed(id: string): Promise<void> {
  const database = await db();
  const game = await database.get("games", id);
  if (!game) return;
  await database.put("games", { ...game, lastPlayedAt: Date.now() });
}

/* ---- save states (single slot per game) ---- */

export async function saveState(gameId: string, data: Blob): Promise<void> {
  await (await db()).put("states", { gameId, data, updatedAt: Date.now() });
}

export async function getStateBlob(gameId: string): Promise<Blob | undefined> {
  return (await (await db()).get("states", gameId))?.data;
}

export async function deleteState(gameId: string): Promise<void> {
  await (await db()).delete("states", gameId);
}

/** Ids of all games that currently have a saved state (for library badges). */
export async function listStateIds(): Promise<string[]> {
  return (await db()).getAllKeys("states");
}
