import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { errorHandler, log } from "@/utils/handlers";
import { userState } from "@/vars/userState";
import { setDuration, setTeamA, setTeamB } from "./commands/match";
import { confirmDeleteMatch } from "./commands/deleteMatch";

const steps: { [key: string]: any } = {
  setTeamA,
  setTeamB,
  setDuration,
  confirmDeleteMatch,
};

export async function executeStep(
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  const chatId = ctx.chat?.id;
  if (!chatId) return ctx.reply("Please redo your action");

  const queryCategory = ctx.callbackQuery?.data?.split("-").at(0);
  const step = userState[chatId] || queryCategory || "";
  const stepFunction = steps[step];

  if (stepFunction) {
    try {
      await stepFunction(ctx);
    } catch (error) {
      errorHandler(error, true);
      ctx.reply("An error occurred while doing the task.");
    }
  } else {
    log(`No step function for ${queryCategory} ${userState[chatId]}`);
  }
}
