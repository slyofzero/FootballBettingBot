import { teleBot } from "@/index";
import { log } from "@/utils/handlers";
import { executeStep } from "../executeStep";
import { CallbackQueryContext, Context } from "grammy";

export function initiateCallbackQueries() {
  teleBot.on("callback_query:data", (ctx) =>
    executeStep(ctx as CallbackQueryContext<Context>)
  );

  log("Bot callback queries up");
}
