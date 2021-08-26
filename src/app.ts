import { CronJob } from 'cron'
import { update, send } from './job';

// const sendJob:CronJob = new CronJob('0 0 0 * * 5', async() => await send());
// const updateJob:CronJob = new CronJob('* */1 * * * *', async() => await update());

(async() => {
  try {
    // if (!sendJob.running) sendJob.start();
    // if (!updateJob.running && !sendJob.running) updateJob.start();
    await send();
    process.exit(0);

  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();