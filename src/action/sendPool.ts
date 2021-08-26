import mysql from 'mysql2/promise';
import { apiClient } from '@liskhq/lisk-client';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { transfer } from '../common/lisk';
import { findManage, updManage } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const sendPool = async(liskClient:apiClient.APIClient, mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[sendPool] Start`);

    // Find: manage
    const manageRow = await findManage(mysqlConnection);
    if (!manageRow) return true;

    // Floor
    const pool:number = +convertBeddowsToLSK(manageRow.pool);
    if (pool < DELEGATE.MINIMUMPAY.POOL) return true;
    const amount = Math.floor(pool * 0.1) / 0.1;
    console.info(`[sendPool] amount=${amount}`);

    // Transfer: pool
    if (!await transfer(liskClient, 0, DELEGATE.POOLADDRESS, convertLSKToBeddows(amount.toString()), "")) {
      console.error(`[sendPool] transfer: failed`);
      return false;
    }

    // Update: manage
    await updManage(mysqlConnection, true, {
      id: manageRow.id,
      self: manageRow.self,
      pool: (BigInt(convertLSKToBeddows(pool.toString())) - BigInt(convertLSKToBeddows(amount.toString()))).toString()
    });

    return true;

  } catch (err) {
    console.info(`[sendPool] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[sendPool] End`);
  }
}