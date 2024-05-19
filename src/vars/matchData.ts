import { StoredMatch } from "@/types";

interface MatchData extends Omit<Partial<StoredMatch>, "duration"> {}

export const matchData: { [key: string]: MatchData } = {};
