import { CronJob } from 'cron'
import { update, send } from './job';

const sendJob:CronJob = new CronJob('0 0 1 * * 6', async() => await send());
const updateJob:CronJob = new CronJob('0 0 */6 * * 1-5', async() => await update());

(async() => {
  try {
    if (!sendJob.running) sendJob.start();
    if (!updateJob.running && !sendJob.running) updateJob.start();

  } catch(err) {
    console.error(err);
    process.exit(1);
  }
})();