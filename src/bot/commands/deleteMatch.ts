import { removeDocumentById } from "@/firebase";
import { errorHandler } from "@/utils/handlers";
import { currentMatch, syncMatch } from "@/vars/currentMatch";
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  InlineKeyboard,
} from "grammy";
import moment from "moment";

export async function deleteMatch(ctx: CommandContext<Context>) {
  // If there's a match already on going
  if (!currentMatch) {
    const message = "There is no match live currently";
    return ctx.reply(message);
  }

  const { teamA, teamB, expiresAt, id } = currentMatch;
  const endsIn = moment(expiresAt.toDate()).fromNow();
  const keyboard = new InlineKeyboard().text(
    "Delete Match",
    `confirmDeleteMatch-${id}`
  );
  const message = `There's already a match going between ${teamA} and ${teamB}. Match ends ${endsIn}.`;
  return ctx.reply(message, { reply_markup: keyboard });
}

export async function confirmDeleteMatch(ctx: CallbackQueryContext<Context>) {
  const matchId = ctx.callbackQuery.data.split("-").at(0);
  if (!matchId) return ctx.reply("No match ID was found");

  removeDocumentById({ collectionName: "matches", id: matchId })
    .then(() => syncMatch())
    .catch((e) => errorHandler(e));

  const message = `Deleted match`;
  ctx.deleteMessage().catch((e) => errorHandler(e));
  return ctx.reply(message);
}
