import mysql from 'mysql2/promise';
import { REWARD } from '../common/type';
import { NETWORK } from '../common/config';
import { getMyAccount } from '../common/lisk';
import { findReward, updReward } from '../common/mysql';

export const updateReward = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateReward] Start`);

    // Get: delegate account
    const account = await getMyAccount();

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);

    // Initial setting: Reward data
    const rewardData:REWARD = { id: NETWORK, cur: account.dpos.delegate.rewards, prev: account.dpos.delegate.rewards, diff: "0" };
    if (rewardRow) rewardData.prev = rewardRow.cur;
    if (BigInt(rewardData.cur) < BigInt(rewardData.prev)) rewardData.cur = rewardData.prev;
    rewardData.diff = (BigInt(rewardData.cur) - BigInt(rewardData.prev)).toString();
    console.info(`[updateReward] cur=${rewardData.cur}, prev=${rewardData.prev}, diff=${rewardData.diff}`);

    // Update: Reward data
    await updReward(mysqlConnection, rewardRow !== undefined, rewardData);
    return true;

  } catch (err) {
    console.info(`[updateReward] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[updateReward] End`);
  }
}