import mysql from 'mysql2/promise';
import { convertBeddowsToLSK } from '@liskhq/lisk-transactions';
import { getMyAccount, transfer } from '../common/lisk';
import { findManage, updManage } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const sendPool = async (mysqlConnection: mysql.Connection): Promise<boolean> => {
  try {
    console.info(`[sendPool] Start`);

    // Find: manage
    const manageRow = await findManage(mysqlConnection);
    if (!manageRow) return true;

    // Floor
    const pool: number = +convertBeddowsToLSK(manageRow.pool);
    if (pool < DELEGATE.MINIMUMPAY.POOL) return true;
    console.info(`[sendPool] amount=${manageRow.pool}`);

    // Get: delegate account
    const account = await getMyAccount();
    const nonce: string = account.sequence.nonce;

    // Transfer: pool
    if (!await transfer(nonce, DELEGATE.POOLADDRESS, manageRow.pool, "")) {
      console.error(`[sendPool] transfer: failed`);
      return false;
    }

    // Update: manage
    await updManage(mysqlConnection, true, { id: manageRow.id, self: manageRow.self, pool: "0" });

    return true;

  } catch (err) {
    console.info(`[sendPool] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[sendPool] End`);
  }
}