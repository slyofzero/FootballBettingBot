import dotenv from "dotenv";

export const { NODE_ENV } = process.env;
dotenv.config({
  path: NODE_ENV === "development" ? ".env" : ".env.production",
});

export const {
  BOT_TOKEN,
  BOT_USERNAME,
  FIREBASE_KEY,
  BETTING_POOL_ADDRESS,
  RPC_URL,
  ENCRYPTION_KEY,
  TOKEN_CA,
} = process.env;
