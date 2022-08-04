import { AzureFunction, Context } from "@azure/functions"
import NordigenClient from "nordigen-node";
import * as ynab from "ynab";
import { AccountDetails, AccountMediator } from "./AccountMediator";

// Functions job 
const ensureYnabAccount: AzureFunction = async function (context: Context, accountId: string): Promise<void> {
    context.log('Account process queue trigger', accountId)

    // Get account metatadata from Nordigen
    const nordigenClient = new NordigenClient({
        secretId: process.env.nordigenSecretId || "",
        secretKey: process.env.nordigenSecretKey || ""
    });
    const ynabAPI = new ynab.API(process.env.ynabApiKey as string) 
  
    await nordigenClient.generateToken();
    
    const account = nordigenClient.account(accountId);
    context.log("Read account reference from Nordigen", JSON.stringify(account))
    const details = account.getDetails() as AccountDetails
   
    const accountToSave = AccountMediator.CreateYnabAccount(details)
        context.log("Account name", details.ownerName)

    // Get or create YNAB account
    const ynabBudgetId = process.env.ynabBudgetId as string; 
    const ynabAccountResponse = await ynabAPI.accounts.getAccounts(ynabBudgetId)
    let ynabAccount = ynabAccountResponse.data.accounts.find(a => a.name === accountToSave.name );
    if(!ynabAccount){
        const resp = await ynabAPI.accounts.createAccount(ynabBudgetId, {
            account: accountToSave
        })
        ynabAccount = resp.data.account
    }

    if(ynabAccount === undefined) {
        throw 'Ynab account could not be created'
    }
    // Get latest event from YNAB account
    const transactionResp = await ynabAPI.transactions.getTransactionsByAccount(ynabBudgetId, ynabAccount.id, ynab.utils.getCurrentMonthInISOFormat())
    const transactions = transactionResp.data.transactions;

    const latestTransaction = transactions.reduce((prev, current) => (!prev || prev.date < current.date) ? current : prev)

    // Get new transactions from Norgigen
    const newTransactions = await account.getTransactions({ dateFrom: latestTransaction?.date || '2022-01-01' })
    const bookedTransactions =  newTransactions.transactions.booked as any[]
    const createdTransactions: ynab.SaveTransaction[] = bookedTransactions.map( t => {
        return {
            account_id: ynabAccount?.id || '',
            date: t.valueDate,
            amount: Math.floor(t.transactionAmount * 1000),
            payee_name: t.debtorName ?? t.creditorName 
        }
    })

    await ynabAPI.transactions.createTransactions(ynabBudgetId, { transactions: createdTransactions})

};

export default queueTrigger;
