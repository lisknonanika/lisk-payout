const cron = require("node-cron");
const batch = require("../batch/payout");

cron.schedule('0 0 9 * * *', () => {
    batch();
});