"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Functions jos is is to tell others what accounts should be refreshed
const scheduleUpdates = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    context.log('Scheduling account fetching');
    const accountIds = process.env['nordigenAccountIds']?.split(',') || [];
    try {
        accountIds.forEach(id => {
            context.log(`Account: ${id}`);
        });
        context.bindings.outputQueueItem = accountIds;
    }
    catch (e) {
        context.log('Failed to send messages');
        throw e;
    }
    context.log('Timer trigger function ran!', timeStamp);
};
exports.default = scheduleUpdates;
