import mysql from 'mysql2/promise';
import { apiClient } from '@liskhq/lisk-client';
import { getMyAccount, transfer } from '../common/lisk';
import { findRewardTargetVoters, updVoter } from '../common/mysql';
import { DELEGATE } from '../common/config';

export const sendReward = async(liskClient:apiClient.APIClient, mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[sendReward] Start`);

    // Find: voters
    const voterRows = await findRewardTargetVoters(mysqlConnection);
    if (!voterRows) return true;

    // Get: delegate account
    const account = await getMyAccount();
    let nonce:string = account.sequence.nonce;

    // Main
    for (const voter of voterRows) {
      // Transfer: reward
      if (!await transfer(liskClient, nonce, voter.address, voter.reward, DELEGATE.MESSAGE)) {
        console.error(`[sendReward] transfer failed: address=${voter.address}, reward=${voter.reward}`);
        continue;
      }

      // Update: voter
      await updVoter(mysqlConnection, true, { id: voter.id, address: voter.address, reward: "0" });

      // Add nonce
      nonce = (BigInt(nonce) + BigInt(1)).toString();
      
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