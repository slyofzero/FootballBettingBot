import { Timestamp } from "firebase-admin/firestore";
import { TeamTypes } from "./match";

export interface StoredBet {
  id?: string;
  team: TeamTypes;
  amount: number;
  match: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  paymentAt: Timestamp;
  odds?: number;
}
