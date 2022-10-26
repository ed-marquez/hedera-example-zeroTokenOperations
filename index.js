console.clear();
import { Client, AccountId, PrivateKey, Hbar, ContractFunctionParameters, TransferTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";

import accountCreateFcn from "./utils/accountCreate.js";
import * as queries from "./utils/queries.js";
import * as htsTokens from "./utils/tokenOperations.js";
import * as contracts from "./utils/contractOperations.js";

// import contract from "./ZeroTokenOperations.json" assert { type: "json" };
import contract from "./test.json" assert { type: "json" };

const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);
const client = Client.forPreviewnet().setOperator(operatorId, operatorKey);
client.setDefaultMaxTransactionFee(new Hbar(100));

async function main() {
	// STEP 1 ===================================
	console.log(`\nSTEP 1 ===================================\n`);
	console.log(`- Creating Hedera accounts, HTS token, and contract...\n`);

	// Accounts
	const initBalance = new Hbar(100);
	const aliceKey = PrivateKey.generateED25519();
	const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
	console.log(`- Alice's account: https://hashscan.io/#/testnet/account/${aliceId}`);

	// Contract
	// Import the compiled contract bytecode
	// const bytecode = fs.readFileSync("./binaries/ZeroTokenOperations.bin");
	// const bytecode = /** @type {string} */ (contract.bytecode);
	const bytecode = /** @type {string} */ (contract.object);
	let gasLim = 4000000;

	const constructorParams = new ContractFunctionParameters().addAddress(operatorId.toSolidityAddress()).addAddress(aliceId.toSolidityAddress());
	const [contractId, contractAddress] = await contracts.deployContractFcn(bytecode, constructorParams, gasLim, client);
	console.log(`\n- Contract ID: ${contractId}`);
	console.log(`- Contract ID in Solidity address format: ${contractAddress}`);

	// //Token
	// const [tokenId, tokenInfo] = await htsTokens.createFtFcn("HBAR ROCKS", "HROCK", 100, treasuryId, treasuryKey, client);
	const tokenCreateRx = await contracts.executeContractPayableFcn(contractId, "step0", gasLim, client);
	console.log(`- Contract call for step 0: ${tokenCreateRx.status} \n`);
	// console.log(`\n- Token ID: ${tokenId}`);
	// console.log(`- Initial token supply: ${tokenInfo.totalSupply.low}`);

	// STEP 2 ===================================
	console.log(`\nSTEP 2 ===================================\n`);
	console.log(`- Transfer...\n`);

	const transferFtRx = await contracts.executeContractFcn(contractId, "step2", gasLim, client);
	console.log(`- Contract call for step 2: ${transferFtRx.status} \n`);

	// STEP 3 ===================================
	console.log(`\nSTEP 3 ===================================\n`);
	console.log(`- Mint or burn...\n`);
	const mintFtRx = await contracts.executeContractFcn(contractId, "step3", gasLim, client);
	console.log(`- Contract call for step 3: ${mintFtRx.status} \n`);
	//
	// const burnFtRx = await contracts.executeContractFcn(contractId, "step4", gasLim, client);
	// console.log(`- Contract call for step 4: ${burnFtRx.status} \n`);

	// STEP 4 ===================================
	console.log(`\nSTEP 4 ===================================\n`);
	console.log(`- Wipe...\n`);
	const wipeFtRx = await contracts.executeContractFcn(contractId, "step5", gasLim, client);
	console.log(`- Contract call for step 4: ${mintFtRx.status} \n`);

	// allowBal = new Hbar(0);
	// const allowanceDeleteHbarRx = await approvals.hbarAllowanceFcn(treasuryId, aliceId, allowBal, treasuryKey, client);
	// console.log(`- Allowance deletion status: ${allowanceDeleteHbarRx.status}`);
	// console.log(`- https://testnet.mirrornode.hedera.com/api/v1/accounts/${treasuryId}/allowances/crypto`);

	// STEP 5 ===================================
	console.log(`\nSTEP 5 ===================================\n`);
	console.log(`- BLAH BLAH...\n`);

	//Transfer token
	const transferToken = new TransferTransaction()
		.addTokenTransfer(tokenId, operatorId, 0) // deduct 0 tokens
		.addTokenTransfer(tokenId, aliceId, 0) // increase balance by 0
		.freezeWith(client);

	const txResponseTransferToken = await transferToken.execute(client);

	//Verify the transaction reached consensus
	const transferReceipRecord = await txResponseTransferToken.getReceipt(client);
	console.log(`${transferReceipRecord.status}`);

	console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);
}
main();
