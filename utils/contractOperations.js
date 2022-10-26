import { ContractCreateFlow, ContractExecuteTransaction, Hbar, TransactionId } from "@hashgraph/sdk";

export async function deployContractFcn(bytecode, params, gasLim, client) {
	const contractCreateTx = new ContractCreateFlow().setBytecode(bytecode).setGas(gasLim).setConstructorParameters(params);
	const contractCreateSubmit = await contractCreateTx.execute(client);
	const contractCreateRx = await contractCreateSubmit.getReceipt(client);
	const contractId = contractCreateRx.contractId;
	const contractAddress = contractId.toSolidityAddress();
	return [contractId, contractAddress];
}

export async function executeContractFcn(cId, fcnName, gasLim, client) {
	const contractExecuteTx = new ContractExecuteTransaction().setContractId(cId).setGas(gasLim).setFunction(fcnName);
	const contractExecuteSubmit = await contractExecuteTx.execute(client);
	const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	return contractExecuteRx;
}

export async function executeContractPayableFcn(cId, fcnName, gasLim, client) {
	// const contractExecuteTx = new ContractExecuteTransaction().setContractId(cId).setGas(gasLim).setFunction(fcnName, params);
	const contractExecuteTx = new ContractExecuteTransaction().setContractId(cId).setGas(gasLim).setFunction(fcnName).setPayableAmount(new Hbar(90));
	const contractExecuteSubmit = await contractExecuteTx.execute(client);
	const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	return contractExecuteRx;
}
