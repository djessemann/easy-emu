import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Game } from "./types";

interface EasyEmuDB extends DBSchema {
  games: {
    key: string;
    value: Game;
    indexes: { addedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<EasyEmuDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<EasyEmuDB>("easy-emu", 1, {
      upgrade(database) {
        const store = database.createObjectStore("games", { keyPath: "id" });
        store.createIndex("addedAt", "addedAt");
      },
    });
  }
  return dbPromise;
}

export async function listGames(): Promise<Game[]> {
  const all = await (await db()).getAllFromIndex("games", "addedAt");
  // Newest first.
  return all.reverse();
}

export async function addGame(game: Game): Promise<void> {
  await (await db()).put("games", game);
}

export async function deleteGame(id: string): Promise<void> {
  await (await db()).delete("games", id);
}

export async function getGame(id: string): Promise<Game | undefined> {
  return (await db()).get("games", id);
}
