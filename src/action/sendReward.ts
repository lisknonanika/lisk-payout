import mysql from 'mysql2/promise';
import { getMyAccount, getTransferTransaction, transfer } from '../common/lisk';
import { findRewardTargetVoters, updVoter } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const sendReward = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[sendReward] Start`);

    // Find: voters
    const voterRows = await findRewardTargetVoters(mysqlConnection);
    if (!voterRows) return true;

    // Get: delegate account
    const account = await getMyAccount();
    const nonce:string = account.sequence.nonce;
    let newNonce:string = nonce;

    // Main 1
    for (const voter of voterRows) {
      // Transfer: reward
      if (!await transfer(newNonce, voter.address, voter.reward, DELEGATE.MESSAGE)) {
        console.error(`[sendReward] transfer failed: address=${voter.address}, reward=${voter.reward}`);
        continue;
      }

      // Add newNonce
      newNonce = (BigInt(newNonce) + BigInt(1)).toString();
      
      // sleep 1 sec.
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
      
    // sleep 30 sec.
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Main 2
    for (const voter of voterRows) {
      const data = await getTransferTransaction(DELEGATE.ADDRESS, voter.address);
      if (!data || BigInt(nonce) > BigInt(data[0].nonce) || BigInt(newNonce) <= BigInt(data[0].nonce)) continue;

      // Update: voter
      await updVoter(mysqlConnection, true, { id: voter.id, address: voter.address, reward: "0" });
      
      // sleep 1 sec.
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return true;

  } catch (err) {
    console.info(`[sendReward] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[sendReward] End`);
  }
}