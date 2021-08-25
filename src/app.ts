import mysql from 'mysql2/promise';
import { NETWORK } from './common/constats';
import { getMysqlConnection } from './common/mysql';
import { updateReward, updateVoter, updateManage } from './action';

(async() => {
  let exitCd = 0;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`Start payout: NETWORK=${NETWORK}`);

    // Update reward
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      exitCd = 1;
      return;
    }
    await mysqlConnection.beginTransaction();

    // update reward
    if (!await updateReward(mysqlConnection)) {
      exitCd = 1;
      return;
    }

    // update voter
    if (!await updateVoter(mysqlConnection)) {
      exitCd = 1;
      return;
    }

    // update manage
    if (!await updateManage(mysqlConnection)) {
      exitCd = 1;
      return;
    }

  } catch (err) {
      console.info(`System error`);
      console.error(err);
      exitCd = 1;
      
  } finally {
    if (mysqlConnection) {
      if (exitCd === 0) {
        mysqlConnection.commit();
      } else {
        mysqlConnection.rollback();
      }
      await mysqlConnection.end();
    }
    console.info(`End payout: NETWORK=${NETWORK}`);
    process.exit(exitCd);
  }
})();