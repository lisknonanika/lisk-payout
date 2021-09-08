import mysql from 'mysql2/promise';
import path from 'path';
import { NETWORK, DELEGATE, OUTPUT } from '../common/config';
import { getMysqlConnection } from '../common/mysql';
import { updateReward, updateVoter, updateManage, outputData } from '../action';

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
    if (DELEGATE.RATE.VOTER > 0) {
      if (!await updateVoter(mysqlConnection)) {
        isError = true;
        return;
      }
    }

    // update manage
    if (DELEGATE.RATE.POOL > 0 || DELEGATE.RATE.SELF >= 0) {
      if (!await updateManage(mysqlConnection)) {
        isError = true;
        return;
      }
    }

  } catch (err) {
      console.info(`[lisk-payout] Update System error`);
      isError = true;
      console.error(err);
      
  } finally {
    if (mysqlConnection) {
      if (isError) {
        await mysqlConnection.rollback();
      } else {
        await mysqlConnection.commit();
        await outputData(mysqlConnection, path.join(OUTPUT.DIR, OUTPUT.FILE));
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] Update End: NETWORK=${NETWORK}`);
  }
}