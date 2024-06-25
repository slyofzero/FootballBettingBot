import { ethers } from 'ethers';
import {
  addDocument,
  getDocument,
  getDocumentById,
  removeDocumentById,
  updateDocumentById,
} from "@/firebase";
import { BETTING_POOL_ADDRESS, TOKEN_CA } from "@/utils/env";
import { StoredAccount, StoredBet, StoredMatch, TeamTypes } from "@/types";
import { cleanUpBotMessage } from "@/utils/bot";
import { transactionValidTime } from "@/utils/constants";
import { encrypt } from "@/utils/cryptography";
import { errorHandler, log, stopScript } from "@/utils/handlers";
import { getSecondsElapsed, sleep } from "@/utils/time";
import { generateAccount, getTokenBalance, sendTransaction } from "@/utils/web3";
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
import {  customAlphabet } from "nanoid";
import { isRegExp } from "util/types";
import { web3 } from "@/rpc";

export async function getUnlockedAccount() {
  let publicKey: string = "";

  const notLockedAccount = (
    await getDocument<StoredAccount>({
      collectionName: "accounts",
      queries: [["locked", "!=", true]],
    })
  ).at(0);

  if (notLockedAccount) {
    publicKey = notLockedAccount.publicKey;
    updateDocumentById({
      id: notLockedAccount.id || "",
      collectionName: "accounts",
      updates: { locked: true, lockedAt: Timestamp.now() },
    });
  } else {
    const newAccount = generateAccount();
    publicKey = newAccount.publicKey;

    const newAccountData: StoredAccount = {
      publicKey,
      secretKey: encrypt(newAccount.secretKey).split(":")[1],
      locked: true,
      lockedAt: Timestamp.now(),
    };

    addDocument({ data: newAccountData, collectionName: "accounts" });
  }

  return publicKey;
}

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
  const message = `You have to chosen to bet on ${teams[team]}. In the next message, please pass the amount that you wish to bet and your wallet address (as "<betamount> <address>).`;
  return ctx.reply(message);
}

export async function prepareBet(ctx: CommandContext<Context>) {
  if (ctx.message?.text.trim().split(" ").length != 2) return ctx.reply("Not all parameters are entered, please try again")
  const amount = Number(ctx.message?.text.trim().split(" ")[0]);
  const userAdd = String(ctx.message?.text.trim().split(" ")[1])
  if (isNaN(amount) || !userAdd.match(/^0x[a-fA-F0-9]{40}$/g)) return ctx.reply("Please pass a valid number and address.");
  const userId = ctx.chatId;
  const userBetData = betData[userId] as BetData | undefined;
  if (!userBetData) return ctx.reply("Please click on the button again.");

  const { team } = userBetData;
  delete userState[userId];

  const { teams } = currentMatch as StoredMatch;
  const cleanedAmount = cleanUpBotMessage(amount);
  const message = `You have to chosen to bet ${amount} on ${teams[team]}\\.
  
Send ${cleanedAmount} to the address mentioned below and click on "I have paid" once done\\. Only send the *exact amount*, sending any more or any less will result in transaction failure\\.

\`${BETTING_POOL_ADDRESS}\`

If you wish to bet a different amount, please click on the button again and click on the "Cancel" button to cancel this transaction\\.\n
Pay within 20 minutes of this message generation, if 20 minutes have already passed then please cancel the transaction and retry again\\.`;

  const nanoid = customAlphabet("123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_")
  const betId = nanoid(21);
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
      sentTo: "0x6198ba65CD9660EA6051C7AC426f545877Ab7b80",
      userAdd: userAdd
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
    log(betId)
    const message = `No bet request was found for bet ID ${betId}, if already paid, please contact the admins.`;
    return ctx.reply(message);
  }

  const { paymentAt, amount, team } = betData;

  const txnhistory: {
  "status": string,
  "message": string,
  "result": [
    {
      "blockNumber": string,
      "timeStamp": string,
      "hash": string,
      "nonce": string,
      "blockHash": string,
      "from": string,
      "contractAddress": string,
      "to": string,
      "value": string,
      "tokenName": string,
      "tokenSymbol": string,
      "tokenDecimal": string,
      "transactionIndex": string,
      "gas": string,
      "gasPrice":string,
      "gasUsed": string,
      "cumulativeGasUsed": string,
      "input": string,
      "confirmations": string
    }
  ]
} = await (await fetch("https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x6982508145454Ce325dDbE47a25d4ec3d2311933&address=0x6198ba65CD9660EA6051C7AC426f545877Ab7b80&page=1&offset=100&startblock=0&endblock=27025780&sort=asc&apikey=A886RIS65BVE9FMY5RZHYD6G9XZT845MCD")).json()
  attemptsCheck: for (const attempt_number of Array.from(Array(20).keys())) {
    try {
      log(`Checking for subscription payment, Attempt - ${attempt_number + 1}`);

      txnhistory.result.forEach((tx) => {
        if (tx.timeStamp && currentMatch?.startedAt.seconds) {
          if (Number(tx.timeStamp) > currentMatch?.startedAt.seconds && tx.contractAddress == TOKEN_CA && tx.from == betData.userAdd && Number(tx.value) == betData.amount * 10 ** Number(tx.tokenDecimal) ) {
            log(`Verified bet ${betId} of amount ${amount} with odds`);
            ctx.deleteMessage().catch((e) => errorHandler(e));
          }
        }
        else {
          log("Tokens havent been sent yet")
        }
      })


      const secondsTillPaymentGeneration = getSecondsElapsed(paymentAt.seconds);
      if (secondsTillPaymentGeneration > transactionValidTime) {
        log(`Transaction ${betId} has expired`);
        const message =
          "Your payment duration has expired. You were warned not to pay after 20 minutes of payment message generation. If you have already paid, contact the admins.";
        return ctx.reply(message);
      }

      // If payment is verified
      const { odds, teams } = currentMatch;
      updateDocumentById<StoredBet>({
        collectionName: "bets",
        id: betId,
        updates: { ...betData, status: "PAID", odds: odds[team] },
      });

      const message = `Your bet was placed with odds ${odds[team]} on ${teams[team]} for ${amount}.`;
      return ctx.reply(message);
    } catch (error) {
      errorHandler(error);
      ctx.reply(`An error occurred, please try again`);
    }
  }
}
