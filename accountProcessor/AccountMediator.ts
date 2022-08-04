import { SaveAccount } from "ynab"

// Understands relationship between Ynab account and Nordigen account
class AccountMediator {

    static CreateYnabAccount(details: AccountDetails ): SaveAccount {
        const owner = details.ownerName?.at(-1) ?? ''
        const iban = details.iban as string
        const name = `${owner} ${details.bic} ${iban.substring(16)}`
        const type = SaveAccount.TypeEnum.Checking
        const balance = 0
        return {...details, name, type, balance}
    }

    
}

class TransactionMediator {

    static CreateTransaction( )
}

type Iban = string
type Name = string
type Bic = string
type AccountDetails = {
    iban:Iban
    ownerName: Name
    bic: Bic
}

export {AccountMediator, AccountDetails}

