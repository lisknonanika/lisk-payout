import mysql from 'mysql2/promise';
import { apiClient } from '@liskhq/lisk-client';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { delegateVote } from '../common/lisk';
import { findManage, updManage } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const selfVote = async(liskClient:apiClient.APIClient, mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[selfVote] Start`);

    // Find: manage
    const manageRow = await findManage(mysqlConnection);
    if (!manageRow) return true;

    // Floor
    const self:number = +convertBeddowsToLSK(manageRow.self);
    if (self < DELEGATE.MINIMUMPAY.SELF) return true;
    const amount = Math.floor(self * 0.1) / 0.1;
    console.info(`[selfVote] amount=${amount}`);

    // Vote
    if(!await delegateVote(liskClient, DELEGATE.ADDRESS, convertLSKToBeddows(amount.toString()))) {
      console.error(`[selfVote] delegate vote: failed`);
      return false;
    }

    // Update: manage
    await updManage(mysqlConnection, true, {
      id: manageRow.id,
      self: (BigInt(convertLSKToBeddows(self.toString())) - BigInt(convertLSKToBeddows(amount.toString()))).toString(),
      pool: manageRow.pool });

    return true;

  } catch (err) {
    console.info(`[selfVote] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[selfVote] End`);
  }
}