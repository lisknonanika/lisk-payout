import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { getMyAccount, delegateVote } from '../common/lisk';
import { findManage, updManage } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const selfVote = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
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

    // Get: delegate account
    const account = await getMyAccount();
    let nonce:string = account.sequence.nonce;

    // Vote
    if(!await delegateVote(nonce, DELEGATE.ADDRESS, convertLSKToBeddows(amount.toString()))) {
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