import mysql from 'mysql2/promise';
import { getMyAccount } from '../common/lisk';
import { findReward, updReward } from '../common/mysql';
import { NETWORK, REWARD } from '../common/constats';

export const updateReward = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateReward] Start`);

    // Get: delegate account
    const account = await getMyAccount();

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);

    // Initial setting: Reward data
    const rewardData:REWARD = { id: NETWORK, cur: account.dpos.delegate.rewards, prev: "0", diff: "0" };
    rewardData.prev = rewardRow? rewardRow.cur: account.dpos.delegate.rewards;
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