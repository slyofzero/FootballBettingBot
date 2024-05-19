import { addDocument, getDocument } from "@/firebase";
import { StoredMatch } from "@/types";
import { defaultOdds } from "@/utils/constants";
import { matchData } from "@/vars/matchData";
import { userState } from "@/vars/userState";
import { Timestamp } from "firebase-admin/firestore";
import { CommandContext, Context } from "grammy";
import moment from "moment";

export async function setMatch(ctx: CommandContext<Context>) {
  const currentMatch = (
    await getDocument<StoredMatch>({ collectionName: "matches" })
  ).at(0);

  // If there's a match already on going
  if (currentMatch) {
    const { teamA, teamB, expiresAt } = currentMatch;
    const endsIn = moment(expiresAt.toDate()).fromNow();
    const message = `There's already a match going between ${teamA} and ${teamB}. Match ends ${endsIn}.`;
    return ctx.reply(message);
  }

  const userId = ctx.chatId;
  userState[userId] = "setTeamA";
  const message =
    "To set a match you'd need three things. Team A and Team B, the teams playing in the match, and the duration this match will last for.\n\nFirst provide the name of Team A.";
  ctx.reply(message);
}

export async function setTeamA(ctx: CommandContext<Context>) {
  const userId = ctx.chatId;
  const teamA = ctx.message?.text.trim();

  if (!teamA) return ctx.reply("Please enter a valid team name");
  matchData[userId] = { teamA };

  userState[userId] = "setTeamB";
  const message = "Next up provide the name of Team B.";
  ctx.reply(message);
}

export async function setTeamB(ctx: CommandContext<Context>) {
  const userId = ctx.chatId;
  const teamB = ctx.message?.text.trim();

  if (!teamB) return ctx.reply("Please enter a valid team name");
  matchData[userId] = { teamB, ...matchData[userId] };

  userState[userId] = "setDuration";
  const message = "Next up provide the duration of the match in hours.";
  ctx.reply(message);
}

export async function setDuration(ctx: CommandContext<Context>) {
  const userId = ctx.chatId;
  const duration = Number(ctx.message?.text.trim());

  if (!duration) return ctx.reply("Please enter a valid team name");
  const { teamA, teamB } = matchData[userId];
  // Clearing out the temporary states
  delete userState[userId];
  delete matchData[userId];

  const currentTimestamp = Timestamp.now();
  const expiresAt = new Timestamp(
    currentTimestamp.seconds + duration * 60 * 60,
    currentTimestamp.nanoseconds
  );

  addDocument<StoredMatch>({
    collectionName: "matches",
    data: {
      teamA: teamA || "",
      teamB: teamB || "",
      expiresAt,
      status: "LIVE",
      teamAOdds: defaultOdds,
      teamBOdds: defaultOdds,
    },
  });

  const message = `Match started between ${teamA} as Team A, and ${teamB} as Team B. Ends in ${duration} hours.`;
  ctx.reply(message);
}
