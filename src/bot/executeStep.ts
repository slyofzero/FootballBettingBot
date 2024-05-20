import { CallbackQueryContext, CommandContext, Context } from "grammy";
import { errorHandler, log } from "@/utils/handlers";
import { userState } from "@/vars/userState";
import { setDuration, setTeamA, setTeamB } from "./commands/match";
import { confirmDeleteMatch } from "./commands/deleteMatch";
import {
  betAmount,
  cancelPayment,
  prepareBet,
  verifyPayment,
} from "./commands/bet";
import { duringMatchOnly } from "@/utils/bot";
import { GenericFunc } from "@/types";

const steps: { [key: string]: GenericFunc | GenericFunc[] } = {
  setTeamA,
  setTeamB,
  setDuration,
  confirmDeleteMatch,
  betAmount: [betAmount, duringMatchOnly],
  prepareBet: [prepareBet, duringMatchOnly],
  cancelPayment,
  verifyPayment,
};

export async function executeStep(
  ctx: CommandContext<Context> | CallbackQueryContext<Context>
) {
  const chatId = ctx.chat?.id;
  if (!chatId) return ctx.reply("Please redo your action");

  const queryCategory = ctx.callbackQuery?.data?.split("-").at(0);
  const step = userState[chatId] || queryCategory || "";
  const stepFunction = steps[step] as GenericFunc | GenericFunc[] | undefined;

  try {
    // If we have a callback function
    if (Array.isArray(stepFunction)) {
      const [callbackFunc, highOrderFunc] = stepFunction;
      await highOrderFunc(callbackFunc, ctx);
    }
    // If we have a stand alone function
    else if (typeof stepFunction === "function") {
      await stepFunction(ctx);
    }
    // If we have a random action
    else {
      log(`No step function for ${queryCategory} ${userState[chatId]}`);
    }
  } catch (error) {
    errorHandler(error, true);
    ctx.reply("An error occurred while doing the task.");
  }
}
