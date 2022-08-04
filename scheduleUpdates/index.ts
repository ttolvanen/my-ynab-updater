import { AzureFunction, Context } from "@azure/functions"

// Functions jos is is to tell others what accounts should be refreshed
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    context.log('Scheduling account fetching')
    
    const accountIds = process.env['nordigenAccountIds']?.split(',') || []  
    accountIds.forEach( id => {
        context.log(`Account: ${id}`)
    })

    context.bindings.outputQueueItem = accountIds

    context.log('Timer trigger function ran!', timeStamp);   
};

export default timerTrigger;
