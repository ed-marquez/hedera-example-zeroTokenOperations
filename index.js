console.clear();
import { Client, AccountId, PrivateKey, Hbar, ContractFunctionParameters, TransferTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();

import accountCreateFcn from "./utils/accountCreate.js";
import * as contracts from "./utils/contractOperations.js";
import * as queries from "./utils/queries.js";
import contract from "./contracts/ZeroTokenOperations.json" assert { type: "json" };

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Creating Hedera accounts, HTS token, and contract...\n`);

	// Accounts
	const initBalance = new Hbar(10);
	const aliceKey = PrivateKey.generateED25519();
	const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
	console.log(`- Alice's account: https://hashscan.io/#/testnet/account/${aliceId}`);

	// Contract
	// Import the compiled contract bytecode
	let gasLim = 4000000;
	const bytecode = contract.object;
	const constructorParams = new ContractFunctionParameters().addAddress(operatorId.toSolidityAddress()).addAddress(aliceId.toSolidityAddress());
	const [contractId, contractAddress] = await contracts.deployContractFcn(bytecode, constructorParams, gasLim, client);
	console.log(`\n- Contract ID: ${contractId}`);
	console.log(`- Contract ID in Solidity address format: ${contractAddress}`);

	// Token
	const tokenCreateRec = await contracts.executeContractPayableFcn(contractId, "createHtsToken", gasLim, client);
	console.log(`\n- Contract call for token creation: ${tokenCreateRec.receipt.status}`);

	const [tokenCreateInfo, tokenCreateExpUrl] = await queries.mirrorTxQueryFcn(tokenCreateRec.transactionId);
	console.log(`- Token ID: ${tokenCreateInfo.data.transactions[1].entity_id}`);
	console.log(`- See details: ${tokenCreateExpUrl}`);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Transfering zero tokens from contract to Alice...\n`);

	const transferFtRec = await contracts.executeContractFcn(contractId, "transferHtsToken", gasLim, client);
	console.log(`- Contract call for token transfer: ${transferFtRec.receipt.status} \n`);

	const [transferFtInfo, transferExpUrl] = await queries.mirrorTxQueryFcn(transferFtRec.transactionId);
	console.log(`- See details: ${transferExpUrl}`);

	// STEP 3 ===================================
	console.log(`\nSTEP 3 ===================================\n`);
	console.log(`- Minting (or burning) zero tokens...\n`);

	const mintFtRec = await contracts.executeContractFcn(contractId, "mintHtsToken", gasLim, client);
	console.log(`- Contract call for minting zero tokens: ${mintFtRec.receipt.status} \n`);

	const [mintFtInfo, mintExpUrl] = await queries.mirrorTxQueryFcn(mintFtRec.transactionId);
	console.log(`- See details: ${mintExpUrl}`);

	// const burnFtRec = await contracts.executeContractFcn(contractId, "burnHtsToken", gasLim, client);
	// console.log(`\n - Contract call for burning zero tokens: ${burnFtRec.receipt.status} \n`);
	// const [burnFtInfo, burnExpUrl] = await queries.mirrorTxQueryFcn(burnFtRec.transactionId);
	// console.log(`- See details: ${burnExpUrl}`);

	// STEP 4 ===================================
	console.log(`\nSTEP 4 ===================================\n`);
	console.log(`- Wiping zero tokens...\n`);

	const wipeFtRec = await contracts.executeContractFcn(contractId, "wipeHtsToken", gasLim, client);
	console.log(`- Contract call for wiping zero tokens: ${wipeFtRec.receipt.status} \n`);

	const [wipeFtInfo, wipeExpUrl] = await queries.mirrorTxQueryFcn(wipeFtRec.transactionId);
	console.log(`- See details: ${wipeExpUrl}`);

	console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);
}
main();
