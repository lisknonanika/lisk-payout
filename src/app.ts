import { NETWORK } from './common/constats';
import { getMysqlConnection } from './common/mysql';
import { updateReward } from './action/updateReward';

(async() => {
  let exitCd = 0;
  try {
    console.info(`Start payout: NETWORK=${NETWORK}`);

    // Update reward
    const mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      exitCd = 1;
      return;
    }

    // update reward
    if (!await updateReward(mysqlConnection)) {
      exitCd = 1;
      return;
    }

  } catch (err) {
      console.info(`System error`);
      console.error(err);
      exitCd = 1;
  } finally {
    console.info(`End payout: NETWORK=${NETWORK}`);
    process.exit(exitCd);
  }
})();