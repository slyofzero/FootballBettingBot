import { StoredMatch, Teams } from "@/types";

interface MatchData
  extends Omit<Omit<Partial<StoredMatch>, "duration">, "teams"> {
  teams: Partial<Teams>;
}

export const matchData: { [key: string]: MatchData } = {};
