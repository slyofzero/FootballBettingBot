import { TeamTypes } from "@/types";

export interface BetData {
  team: TeamTypes;
  amount: number;
}

export const betData: { [key: string]: Partial<BetData> } = {};
