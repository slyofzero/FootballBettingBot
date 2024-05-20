import {
  addDocument,
  getDocumentById,
  removeDocumentById,
  updateDocumentById,
} from "@/firebase";
import { StoredBet, StoredMatch, TeamTypes } from "@/types";
import { cleanUpBotMessage } from "@/utils/bot";
import { transactionValidTime } from "@/utils/constants";
import { MAIN_ADDRESS } from "@/utils/env";
import { errorHandler, log } from "@/utils/handlers";
import { getSecondsElapsed } from "@/utils/time";
import { BetData, betData } from "@/vars/betData";
import { currentMatch } from "@/vars/currentMatch";
import { userState } from "@/vars/userState";
import { Timestamp } from "firebase-admin/firestore";
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  InlineKeyboard,
} from "grammy";
import moment from "moment";
import { nanoid } from "nanoid";

export async function bet(ctx: CommandContext<Context>) {
  const { teams, odds, expiresAt } = currentMatch as StoredMatch;
  const endsIn = moment(expiresAt.toDate()).fromNow();

  const message = `*${teams.A}* Vs *${teams.B}*
  
${teams.A} odds \\- ${odds.A}
${teams.B} odds \\- ${odds.B}

Ends ${endsIn}`;

  const keyboard = new InlineKeyboard()
    .text(`Bet ${teams.A}`, `betAmount-A`)
    .text(`Bet ${teams.B}`, `betAmount-B`);

  return ctx.reply(message, {
    parse_mode: "MarkdownV2",
    reply_markup: keyboard,
  });
}

export async function betAmount(ctx: CallbackQueryContext<Context>) {
  const team = ctx.callbackQuery.data.split("-").at(-1) as
    | TeamTypes
    | undefined;
  if (!team) return ctx.reply("No team to bet on was found");

  const userId = ctx.chat?.id;
  if (!userId) return ctx.reply("Please click on the button again");

  betData[userId] = { team };
  userState[userId] = "prepareBet";

  const { teams } = currentMatch as StoredMatch;
  const message = `You have to chosen to bet on ${teams[team]}. In the next message, please pass the amount that you wish to bet.`;
  return ctx.reply(message);
}

export async function prepareBet(ctx: CommandContext<Context>) {
  const amount = Number(ctx.message?.text.trim());
  if (isNaN(amount)) return ctx.reply("Please pass a valid number.");

  const userId = ctx.chatId;
  const userBetData = betData[userId] as BetData | undefined;
  if (!userBetData) return ctx.reply("Please click on the button again.");

  const { team } = userBetData;
  delete userState[userId];

  const { teams } = currentMatch as StoredMatch;
  const cleanedAmount = cleanUpBotMessage(amount);
  const message = `You have to chosen to bet ${amount} on ${teams[team]}\\.
  
Send ${cleanedAmount} to the address mentioned below and click on "I have paid" once done\\. Only send the *exact amount*, sending any more or any less will result in transaction failure\\.

\`${MAIN_ADDRESS}\`

If you wish to bet a different amount, please click on the button again and click on the "Cancel" button to cancel this transaction\\.\n
Pay within 20 minutes of this message generation, if 20 minutes have already passed then please cancel the transaction and retry again\\.`;

  const betId = nanoid(10);
  const keyboard = new InlineKeyboard()
    .text("✅ I have paid", `verifyPayment-${betId}`)
    .text("❌ Cancel", `cancelPayment-${betId}`);

  const { id: matchId } = currentMatch as StoredMatch;
  addDocument<StoredBet>({
    collectionName: "bets",
    data: {
      amount,
      team,
      match: matchId || "",
      status: "PENDING",
      paymentAt: Timestamp.now(),
    },
    id: betId,
  });

  log(`Prepared bet ${betId} of ${amount}`);

  return ctx.reply(message, {
    reply_markup: keyboard,
    parse_mode: "MarkdownV2",
  });
}

export async function cancelPayment(ctx: CallbackQueryContext<Context>) {
  const betId = ctx.callbackQuery.data.split("-").at(-1) as string;
  removeDocumentById({ collectionName: "bets", id: betId });
  ctx.deleteMessage();
  log(`Cancelled bet ${betId}`);
}

export async function verifyPayment(ctx: CallbackQueryContext<Context>) {
  if (!currentMatch) {
    const message =
      "The live match has ended, if you already paid for the bet please contact the admins for a refund.";
    return message;
  }

  const betId = ctx.callbackQuery.data.split("-").at(-1) as string;
  const betData = await getDocumentById<StoredBet>({
    collectionName: "bets",
    id: betId,
  });

  if (!betData) {
    const message = `No bet request was found for bet ID ${betId}, if already paid, please contact the admins.`;
    return ctx.reply(message);
  }

  // If payment is verified
  const { paymentAt, amount, team } = betData;
  const secondsTillPaymentGeneration = getSecondsElapsed(paymentAt.seconds);
  if (secondsTillPaymentGeneration > transactionValidTime) {
    log(`Transaction ${betId} has expired`);
    const message =
      "Your payment duration has expired. You were warned not to pay after 20 minutes of payment message generation. If you have already paid, contact the admins.";
    return ctx.reply(message);
  }

  const { odds, teams } = currentMatch;
  updateDocumentById<StoredBet>({
    collectionName: "bets",
    id: betId,
    updates: { ...betData, status: "PAID", odds: odds[team] },
  });

  log(`Verified bet ${betId} of amount ${amount} with odds`);
  ctx.deleteMessage().catch((e) => errorHandler(e));

  const message = `Your bet was placed with odds ${odds[team]} on ${teams[team]} for ${amount}.`;
  return ctx.reply(message);
}
