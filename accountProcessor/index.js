"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nordigen_node_1 = __importDefault(require("nordigen-node"));
const ynab = __importStar(require("ynab"));
// Functions job 
const queueTrigger = async function (context, accountId) {
    context.log('Account process queue trigger', accountId);
    // Get account metatadata from Nordigen
    const client = new nordigen_node_1.default({
        secretId: process.env.nordigenSecretId || "",
        secretKey: process.env.nordigenSecretKey || ""
    });
    await client.generateToken();
    const account = client.account(accountId);
    context.log("Read account reference from Nordigen", JSON.stringify(account));
    const details = account.getDetails();
    const ownerName = details.ownerName;
    const parts = ownerName.split(' ');
    const owner = parts[parts.length - 1];
    const iban = details.iban;
    const accountName = `${owner} ${details.bic} ${iban.substring(16)}`;
    context.log("Account name", accountName);
    // Get or create  YNAB account
    const ynabAPI = new ynab.API(process.env.ynabApiKey);
    const ynabBudgetId = process.env.ynabBudgetId;
    const ynabAccountResponse = await ynabAPI.accounts.getAccounts(ynabBudgetId);
    let ynabAccount = ynabAccountResponse.data.accounts.find(a => a.name === accountName);
    if (!ynabAccount) {
        const resp = await ynabAPI.accounts.createAccount(ynabBudgetId, {
            account: {
                name: accountName,
                type: ynab.SaveAccount.TypeEnum.Checking,
                balance: 0
            }
        });
        ynabAccount = resp.data.account;
    }
    if (ynabAccount === undefined) {
        throw 'Ynab account could not be created';
    }
    // Get latest event from YNAB account
    const transactionResp = await ynabAPI.transactions.getTransactionsByAccount(ynabBudgetId, ynabAccount.id, ynab.utils.getCurrentMonthInISOFormat());
    const transactions = transactionResp.data.transactions;
    const latestTransaction = transactions.reduce((prev, current) => (!prev || prev.date < current.date) ? current : prev);
    // Get new transactions from Norgigen
    const newTransactions = await account.getTransactions({ dateFrom: latestTransaction?.date || '2022-01-01' });
    const bookedTransactions = newTransactions.transactions.booked;
    const createdTransactions = bookedTransactions.map(t => {
        return {
            account_id: ynabAccount?.id || '',
            date: t.valueDate,
            amount: Math.floor(t.transactionAmount * 1000),
            payee_name: t.debtorName ?? t.creditorName
        };
    });
    await ynabAPI.transactions.createTransactions(ynabBudgetId, { transactions: createdTransactions });
};
exports.default = queueTrigger;
