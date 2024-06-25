import crypto from "crypto";
import { ENCRYPTION_KEY } from "./env";
import { stopScript } from "./handlers";

export function encrypt(item: string) {
  if (!ENCRYPTION_KEY) {
    stopScript("ENCRYPTION_KEY is undefined");
    return "";
  }

  console.log(ENCRYPTION_KEY);

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-ctr", Buffer.from(ENCRYPTION_KEY, "base64"), iv);
  const encryptedPrivateKey = Buffer.concat([
    cipher.update(item, "utf8"),
    cipher.final(),
  ]).toString("hex");

  return iv.toString('hex') + ':' + encryptedPrivateKey;
}

export function decrypt(encryptedItem: string) {
  if (!ENCRYPTION_KEY) {
    stopScript("ENCRYPTION_KEY is undefined");
    return "";
  }

  const parts = encryptedItem.split(":")
  const iv = Buffer.from(parts[0], "hex")

  console.log(iv);

  const decipher = crypto.createDecipheriv("aes-256-ctr", ENCRYPTION_KEY, iv);
  const decryptedPrivateKey = Buffer.concat([
    decipher.update(Buffer.from(encryptedItem, "hex")),
    decipher.final(),
  ]).toString();

  return decryptedPrivateKey;
}
