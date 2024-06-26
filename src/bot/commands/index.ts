import { teleBot } from "@/index";
import { startBot } from "./start";
import { log } from "@/utils/handlers";
import { setMatch } from "./match";
import { executeStep } from "../executeStep";
import { CommandContext, Context } from "grammy";
import { deleteMatch } from "./deleteMatch";
import { adminsOnly, duringMatchOnly } from "@/utils/bot";
import { bet } from "./bet";
import { setOdds } from "./setOdds";

export function initiateBotCommands() {
  teleBot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "bet", description: "To place bets on the current match" },
  ]);

  teleBot.command("start", (ctx) => startBot(ctx));
  teleBot.command("bet", (ctx) => duringMatchOnly(bet, ctx));
  teleBot.command("match", (ctx) => adminsOnly(setMatch, ctx));
  teleBot.command("setOdds", (ctx) => adminsOnly(setOdds, ctx));
  teleBot.command("deleteMatch", (ctx) => adminsOnly(deleteMatch, ctx));

  teleBot.on(["message"], (ctx) => {
    executeStep(ctx as CommandContext<Context>);
  });

  log("Bot commands up");
}
