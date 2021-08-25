import mysql from 'mysql2/promise';
import { NETWORK } from './common/constats';
import { getMysqlConnection } from './common/mysql';
import { updateReward, updateVoter, updateManage } from './action';

(async() => {
  let exitCd = 0;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Start: NETWORK=${NETWORK}`);

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
      console.info(`[lisk-payout] System error`);
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
    console.info(`[lisk-payout] End: NETWORK=${NETWORK}`);
    process.exit(exitCd);
  }
})();