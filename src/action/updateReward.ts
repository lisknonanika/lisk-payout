import mysql from 'mysql2/promise';
import { convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { REWARD } from '../common/type';
import { NETWORK } from '../common/config';
import { getForgedBlocks } from '../common/lisk';
import { findReward, updReward } from '../common/mysql';

export const updateReward = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateReward] Start`);

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);

    // Get: forged blocks
    const forgedBlocks = await getForgedBlocks();

    // Initial setting: Reward data
    const rewardData:REWARD = { id: NETWORK, cur: forgedBlocks, prev: forgedBlocks, forge: "0" };
    if (rewardRow) rewardData.prev = rewardRow.cur;
    if (rewardData.cur < rewardData.prev) rewardData.cur = rewardData.prev;
    if (rewardData.cur > rewardData.prev) rewardData.forge = convertLSKToBeddows((rewardData.cur - rewardData.prev).toString());
    console.info(`[updateReward] cur=${rewardData.cur}, prev=${rewardData.prev}, forge=${rewardData.forge}`);

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
