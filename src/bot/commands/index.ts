import { teleBot } from "@/index";
import { startBot } from "./start";
import { log } from "@/utils/handlers";
import { setMatch } from "./match";
import { executeStep } from "../executeStep";
import { CommandContext, Context } from "grammy";
import { deleteMatch } from "./deleteMatch";

export function initiateBotCommands() {
  teleBot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
  ]);

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("match", (ctx) => setMatch(ctx));
  teleBot.command("deleteMatch", (ctx) => deleteMatch(ctx));

  teleBot.on(["message"], (ctx) => {
    executeStep(ctx as CommandContext<Context>);
  });

  log("Bot commands up");
}
