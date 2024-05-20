import { Timestamp } from "firebase-admin/firestore";

export type TeamTypes = "A" | "B";
export type Odds = { [key in TeamTypes]: number };
export type Teams = { [key in TeamTypes]: string };

export interface StoredMatch {
  id?: string;
  status: "LIVE" | "EXPIRED";
  teams: Teams;
  odds: Odds;
  expiresAt: Timestamp;
}
