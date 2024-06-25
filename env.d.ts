declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string | undefined;
      BOT_USERNAME: string | undefined;
      NODE_ENV: "development" | "production";
      BETTING_POOL_ADDRESS: "development" | "production";
      FIREBASE_KEY: string | undefined;
      ENCRYPTION_KEY: string | undefined;
      TOKEN_CA: string | undefined;
      RPC_URL: string | undefined;
      IV: string | undefined;
    }
  }
}

export {};
