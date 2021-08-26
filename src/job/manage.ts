import mysql from 'mysql2/promise';
import { apiClient } from '@liskhq/lisk-client';
import { NETWORK } from '../common/config';
import { getLiskClient } from '../common/lisk';
import { getMysqlConnection } from '../common/mysql';
import { sendPool, selfVote } from '../action';

export const manage = async() => {
  let isError = false;
  let liskClient:apiClient.APIClient|undefined = undefined;
  let mysqlConnection:mysql.Connection|undefined = undefined;
  try {
    console.info(`[lisk-payout] Manage Start: NETWORK=${NETWORK}`);

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
    await new Promise(resolve => setTimeout(resolve, 60000));
    if (!await sendPool(liskClient, mysqlConnection)) {
      isError = true;
      return;
    }

    // self vote
    await new Promise(resolve => setTimeout(resolve, 60000));
    if (!await selfVote(liskClient, mysqlConnection)) {
      isError = true;
      return;
    }

  } catch (err) {
    console.info(`[lisk-payout] Manage System error`);
    isError = true;
    console.error(err);
    
  } finally {
    if (liskClient) liskClient.disconnect();
    if (mysqlConnection) {
      if (isError) {
        mysqlConnection.rollback();
      } else {
        mysqlConnection.commit();
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] Manage End: NETWORK=${NETWORK}`);
  }
}