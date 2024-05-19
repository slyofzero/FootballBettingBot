import { Timestamp } from "firebase-admin/firestore";

export interface StoredMatch {
  id?: string;
  teamA: string;
  teamB: string;
  expiresAt: Timestamp;
}
