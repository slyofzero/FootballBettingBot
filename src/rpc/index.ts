import { erc20Abi } from "@/utils/constants";
import { RPC_URL, TOKEN_CA } from "@/utils/env";
import { ethers } from "ethers";
import Web3 from "web3";
import { RegisteredSubscription } from "web3/lib/commonjs/eth.exports";

export const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
export const web3: Web3<RegisteredSubscription> = new Web3(RPC_URL);
export const contract = new web3.eth.Contract(erc20Abi, TOKEN_CA);
