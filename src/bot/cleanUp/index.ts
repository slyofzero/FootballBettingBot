import { cleanUpMatch } from "./currentMatch";

export async function cleanUpExpired() {
  await Promise.all([cleanUpMatch()]);
}
