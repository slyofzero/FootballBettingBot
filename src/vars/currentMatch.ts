import { getDocument } from "@/firebase";
import { StoredMatch } from "@/types";
import { log } from "@/utils/handlers";

export let currentMatch: StoredMatch | null = null;

export async function syncMatch() {
  currentMatch =
    (
      await getDocument<StoredMatch>({
        collectionName: "matches",
        queries: [["status", "==", "LIVE"]],
      })
    ).at(0) || null;

  log("Synced match with firebase");
}
