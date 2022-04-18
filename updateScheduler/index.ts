import { AzureFunction, Context } from "@azure/functions"

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    
    context.log('Scheduling account fetching')
 
    const accountIds = process.env['nordigenAccountIds'].split(',')    
    try { 
        accountIds.forEach( id => {
            context.log(`Account: ${id}`)
        })

        context.bindings.outputQueueItem = accountIds

    }catch(e) {
      context.log('Failed to send messages')  
      throw e
    }
  
    context.log('Timer trigger function ran!', timeStamp);   
};

export default timerTrigger;
