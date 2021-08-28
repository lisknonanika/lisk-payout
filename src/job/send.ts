import mysql from 'mysql2/promise';
import { apiClient } from '@liskhq/lisk-client';
import { NETWORK, DELEGATE } from '../common/config';
import { getLiskClient } from '../common/lisk';
import { getMysqlConnection } from '../common/mysql';
import { sendReward } from '../action';

export const send = async() => {
  let isError = false;
  let liskClient:apiClient.APIClient|undefined = undefined;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Send Start: NETWORK=${NETWORK}`);
    if (DELEGATE.RATE.VOTER <= 0) return;

    // get liskClient
    liskClient = await getLiskClient();
    if (!liskClient) {
      isError = true;
      return;
    }

    // get mysql connection
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      isError = true;
      return;
    }
    await mysqlConnection.beginTransaction();

    // send reward
    if (!await sendReward(liskClient, mysqlConnection)) {
      isError = true;
      return;
    }

  } catch (err) {
    console.info(`[lisk-payout] Send System error`);
    isError = true;
    console.error(err);
    
  } finally {
    if (liskClient) await liskClient.disconnect();
    if (mysqlConnection) {
      if (isError) {
        await mysqlConnection.rollback();
      } else {
        await mysqlConnection.commit();
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] Send End: NETWORK=${NETWORK}`);
  }
}