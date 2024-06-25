import { updateDocumentById } from "@/firebase";
import { StoredMatch, TeamTypes } from "@/types";
import { log } from "@/utils/handlers";
import { currentMatch, syncMatch } from "@/vars/currentMatch";
import { OddsData, oddsData } from "@/vars/oddsData";
import { userState } from "@/vars/userState";
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  InlineKeyboard,
} from "grammy";

export async function setOdds(ctx: CommandContext<Context>) {
  const { teams, odds } = currentMatch as StoredMatch;

  const message = `*${teams.A}* Vs *${teams.B}*
  
${teams.A} odds \\- ${odds.A}
${teams.B} odds \\- ${odds.B}

Which team's odds do you want to change?`;

  const keyboard = new InlineKeyboard()
    .text(`${teams.A}`, `changeOdds-A`)
    .text(`${teams.B}`, `changeOdds-B`);

  return ctx.reply(message, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

export async function changeOdds(ctx: CallbackQueryContext<Context>) {
  const team = ctx.callbackQuery.data.split("-").at(-1) as
    | TeamTypes
    | undefined;
  if (!team) return ctx.reply("No team to change odds of was found");

  const userId = ctx.chat?.id;
  if (!userId) return ctx.reply("Please do click on the button again");

  oddsData[userId] = { team };
  userState[userId] = "confirmOdds";

  const { teams } = currentMatch as StoredMatch;
  const message = `In the next message, please pass the new odds for ${teams[team]}.`;
  return ctx.reply(message);
}

export async function confirmOdds(ctx: CommandContext<Context>) {
  const odds = Number(ctx.message?.text.trim());
  if (isNaN(odds)) return ctx.reply("Please pass a valid number.");

  const userId = ctx.chatId;
  const userOddsData = oddsData[userId] as OddsData | undefined;
  if (!userOddsData) return ctx.reply("Please click on the button again.");

  const { team } = userOddsData;
  delete userState[userId];

  const { teams } = currentMatch as StoredMatch;
  const message = `Odds for team ${teams[team]} set to ${odds}.`;

  const { id: matchId, odds: storedOdds } = currentMatch as StoredMatch;
  const newOdds = structuredClone(storedOdds);
  newOdds[team] = odds;

  updateDocumentById<StoredMatch>({
    collectionName: "matches",
    updates: {
      odds: newOdds,
    },
    id: matchId || "",
  }).then(() => syncMatch());

  log(`Changed odds for team ${teams[team]} to ${odds}`);

  return ctx.reply(message);
}
