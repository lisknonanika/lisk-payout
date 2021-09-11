import mysql from 'mysql2/promise';
import path from 'path';
import { apiClient } from '@liskhq/lisk-client';
import { NETWORK, DELEGATE, OUTPUT } from '../common/config';
import { getLiskClient } from '../common/lisk';
import { getMysqlConnection } from '../common/mysql';
import { sendPool, selfVote, outputData } from '../action';

export const manage = async() => {
  let isError = false;
  let liskClient:apiClient.APIClient|undefined = undefined;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Manage Start: NETWORK=${NETWORK}`);
    if (DELEGATE.RATE.POOL <= 0 && DELEGATE.RATE.SELF <= 0) return;

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

    // send pool
    if (DELEGATE.RATE.POOL > 0) {
      await new Promise(resolve => setTimeout(resolve, 60000));
      if (!await sendPool(liskClient, mysqlConnection)) {
        isError = true;
        return;
      }
    }

    // self vote
    if (DELEGATE.RATE.SELF > 0) {
      await new Promise(resolve => setTimeout(resolve, 60000));
      if (!await selfVote(liskClient, mysqlConnection)) {
        isError = true;
        return;
      }
    }

  } catch (err) {
    console.info(`[lisk-payout] Manage System error`);
    isError = true;
    console.error(err);
    
  } finally {
    if (liskClient) await liskClient.disconnect();
    if (mysqlConnection) {
      if (isError) {
        await mysqlConnection.rollback();
      } else {
        await mysqlConnection.commit();
        await outputData(mysqlConnection, path.join(OUTPUT.DIR, OUTPUT.FILE));
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] Manage End: NETWORK=${NETWORK}`);
  }
}