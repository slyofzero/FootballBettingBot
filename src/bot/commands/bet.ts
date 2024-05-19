import { currentMatch } from "@/vars/currentMatch";
import { CommandContext, Context, InlineKeyboard } from "grammy";
import moment from "moment";

export async function bet(ctx: CommandContext<Context>) {
  if (!currentMatch) {
    const message =
      "There is no live match right now. You'll be notified when a match starts.";
    return ctx.reply(message);
  }

  const { teamA, teamB, teamAOdds, teamBOdds, expiresAt } = currentMatch;
  const endsIn = moment(expiresAt.toDate()).fromNow();

  const message = `*${teamA}* Vs *${teamB}*
  
${teamA} odds \\- ${teamAOdds}
${teamB} odds \\- ${teamBOdds}

Ends ${endsIn}`;

  const keyboard = new InlineKeyboard()
    .text(`Bet ${teamA}`)
    .text(`Bet ${teamB}`);
  return ctx.reply(message, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}
