import mysql from 'mysql2/promise';
import { NETWORK } from '../common/config';
import { getMysqlConnection } from '../common/mysql';
import { updateReward, updateVoter, updateManage } from '../action';

export const update = async() => {
  let isError = false;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Update Start: NETWORK=${NETWORK}`);

    // get connection
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      isError = true;
      return;
    }
    await mysqlConnection.beginTransaction();

    // update reward
    if (!await updateReward(mysqlConnection)) {
      isError = true;
      return;
    }

    // update voter
    if (!await updateVoter(mysqlConnection)) {
      isError = true;
      return;
    }

    // update manage
    if (!await updateManage(mysqlConnection)) {
      isError = true;
      return;
    }

  } catch (err) {
      console.info(`[lisk-payout] Update System error`);
      isError = true;
      console.error(err);
      
  } finally {
    if (mysqlConnection) {
      if (isError) {
        mysqlConnection.rollback();
      } else {
        mysqlConnection.commit();
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] Update End: NETWORK=${NETWORK}`);
  }
}