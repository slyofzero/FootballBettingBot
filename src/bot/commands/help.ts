import { CommandContext, Context } from "grammy";

export async function help(ctx: CommandContext<Context>) {
  const text = `
  For users:
  - /help to see this message
  - /bet to bet on the current match
  
  For admins:
  - /match to set a new match
  - /setOdds to set the odds for the current match
  - /deleteMatch to remove the current match
  
  If you have any issues with payment, *reach out to the admin team* for refunds and/or payments`;
  ctx.reply(text, {
    parse_mode: "Markdown"
  });
}
