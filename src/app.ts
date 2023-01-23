import { CronJob } from 'cron'
import { update, send, manage } from './job';
import { CRON } from './common/config'

const updateJob: CronJob = new CronJob(CRON.UPDATE, async () => await update());
const sendJob: CronJob = new CronJob(CRON.SEND, async () => await send());
const manageJob: CronJob = new CronJob(CRON.MANAGE, async () => await manage());

(async () => {
  try {
    // Initialize
    await update();

    // Job
    if (!updateJob.running) updateJob.start();
    if (!sendJob.running) sendJob.start();
    if (!manageJob.running) manageJob.start();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();