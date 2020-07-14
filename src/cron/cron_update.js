const cron = require("node-cron");
const batch = require("../batch/forgeUpdate");

cron.schedule('0 0 6,18 * * *', () => {
    batch();
});