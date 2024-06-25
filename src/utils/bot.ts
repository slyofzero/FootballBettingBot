import { admins } from "@/vars/admins";
import { currentMatch } from "@/vars/currentMatch";
import { CallbackQueryContext, CommandContext, Context } from "grammy";

type StepFunctions = (ctx: any) => any;

export function adminsOnly(fn: StepFunctions, ctx: CommandContext<Context>) {
  const isAdmin = admins.some(
    ({ username }) => username === ctx.chat?.username
  );

  console.log(isAdmin);

  if (isAdmin) fn(ctx);
}

export function duringMatchOnly(
  fn: StepFunctions,
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  if (!currentMatch) {
    const message =
      "There is no live match right now. You'll be notified when a match starts.";
    return ctx.reply(message);
  }

  fn(ctx);
}

// eslint-disable-next-line
export function cleanUpBotMessage(text: any) {
  text = String(text);
  text = text
    .replace(/\./g, "\\.")
    .replace(/-/g, "\\-")
    .replace(/!/g, "\\!")
    .replace(/#/g, "\\#");

  return text;
}

// eslint-disable-next-line
export function hardCleanUpBotMessage(text: any) {
  text = String(text);
  text = text
    .replace(/\./g, "\\.")
    .replace(/-/g, "\\-")
    .replace(/_/g, "\\_")
    .replace(/\|/g, "\\|")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/`/g, "\\`")
    .replace(/\+/g, "\\+")
    .replace(/!/g, "\\!")
    .replace(/#/g, "\\#")
    .replace(/\*/g, "\\*");

  return text;
}
