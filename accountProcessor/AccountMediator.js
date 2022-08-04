"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountMediator = void 0;
const ynab_1 = require("ynab");
// Understands relationship between Ynab account and Nordigen account
class AccountMediator {
    static CreateYnabAccount(details) {
        const owner = details.ownerName?.at(-1) ?? '';
        const iban = details.iban;
        const name = `${owner} ${details.bic} ${iban.substring(16)}`;
        const type = ynab_1.SaveAccount.TypeEnum.Checking;
        const balance = 0;
        return { ...details, name, type, balance };
    }
}
exports.AccountMediator = AccountMediator;
