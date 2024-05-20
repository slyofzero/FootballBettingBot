import { TeamTypes } from "@/types";

export interface OddsData {
  team: TeamTypes;
  odds: number;
}

export const oddsData: { [key: string]: Partial<OddsData> } = {};
