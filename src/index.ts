import { Bot } from "grammy";
import {
  cleanUpExpired,
  initiateBotCommands,
  initiateCallbackQueries,
} from "./bot";
import { log } from "./utils/handlers";
import { BOT_TOKEN } from "./utils/env";
import { syncAdmins } from "./vars/admins";
import { syncMatch } from "./vars/currentMatch";

export const teleBot = new Bot(BOT_TOKEN || "");
log("Bot instance ready");

// Check for new transfers at every 20 seconds
const interval = 20;

(async function () {
  teleBot.start();
  log("Telegram bot setup");
  initiateBotCommands();
  initiateCallbackQueries();

  await Promise.all([syncAdmins(), syncMatch()]);

  async function toRepeat() {
    cleanUpExpired();
    setTimeout(toRepeat, interval * 1e3);
  }
  await toRepeat();
})();
