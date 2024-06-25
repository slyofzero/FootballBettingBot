import { ethers } from "ethers";
import { errorHandler, log } from "./handlers";
import { contract, provider, web3 } from "@/rpc";
import { BETTING_POOL_ADDRESS } from "./env";
import { gasLimit } from "./constants";

export function isValidEthAddress(address: string) {
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
}

export async function getTokenBalance(address: string) {
  try {
    const balance = (await contract.methods
      .balanceOf(address)
      .call()) as bigint;
    const decimals = (await contract.methods.decimals().call()) as bigint;
    const tokenBalance = balance / 10n ** decimals;
    return tokenBalance;
  } catch (error) {
    return 0n;
  }
}

export function generateAccount() {
  const wallet = ethers.Wallet.createRandom();

  const data = {
    publicKey: wallet.address,
    secretKey: wallet.privateKey,
  };
  return data;
}

export async function sendTransaction(
  secretKey: string,
  amount: bigint,
  to?: string
) {
  try {
    const wallet = new ethers.Wallet(secretKey, provider);
    const gasPrice = await web3.eth.getGasPrice();
    const value = amount - gasLimit * gasPrice;

    const tx = await wallet.sendTransaction({
      to,
      value,
      gasLimit,
      gasPrice,
    });

    return tx;
  } catch (error) {
    log(`No transaction for ${amount} to ${to}`);
    errorHandler(error);
  }
}

export async function splitPayment(
  secretKey: string,
  totalPaymentAmount: bigint
) {
  try {
    const mainTx = await sendTransaction(
      secretKey,
      totalPaymentAmount,
      BETTING_POOL_ADDRESS,
    ); // prettier-ignore
    if (mainTx) log(`Main share ${totalPaymentAmount} sent ${mainTx.hash}`);
  } catch (error) {
    errorHandler(error);
  }
}
