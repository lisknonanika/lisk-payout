import mysql from 'mysql2/promise';
import path from 'path';
import { NETWORK, DELEGATE, OUTPUT } from '../common/config';
import { getMysqlConnection } from '../common/mysql';
import { sendReward, outputData } from '../action';

export const send = async() => {
  let isError = false;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Send Start: NETWORK=${NETWORK}`);
    if (DELEGATE.RATE.VOTER <= 0) return;

    // get mysql connection
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      isError = true;
      return;
    }
    await mysqlConnection.beginTransaction();

    try {
      await outputData(mysqlConnection, path.join(OUTPUT.DIR,  `beforeSend_${OUTPUT.FILE}`));
    } catch (err) {
      // none
    }

    // send reward
    if (!await sendReward(mysqlConnection)) {
      isError = true;
      return;
    }

  } catch (err) {
    console.info(`[lisk-payout] Send System error`);
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
    console.info(`[lisk-payout] Send End: NETWORK=${NETWORK}`);
  }
}