import { updateDocumentById } from "@/firebase";
import { StoredMatch } from "@/types";
import { errorHandler, log } from "@/utils/handlers";
import { currentMatch, syncMatch } from "@/vars/currentMatch";

export async function cleanUpMatch() {
  if (currentMatch) {
    try {
      const { expiresAt, id } = currentMatch;
      const currentTime = Math.floor(new Date().getTime() / 1e3);

      if (expiresAt && currentTime > expiresAt?.seconds) {
        await updateDocumentById<StoredMatch>({
          updates: { status: "EXPIRED" },
          collectionName: "matches",
          id: id || "",
        });
        log(`Match ${id} expired`);

        await syncMatch();
      }
    } catch (error) {
      errorHandler(error);
    }
  }
}
