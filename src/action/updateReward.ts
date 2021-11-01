import mysql from 'mysql2/promise';
import { REWARD } from '../common/type';
import { NETWORK } from '../common/config';
import { getForgedBlocks } from '../common/lisk';
import { findReward, updReward } from '../common/mysql';

export const updateReward = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateReward] Start`);

    // Get: forged blocks
    const blocks = await getForgedBlocks();
    const height = blocks[0].height;

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);

    // Initial setting: Reward data
    const rewardData:REWARD = { id: NETWORK, cur: height, prev: height, forge: "0" };
    if (rewardRow) rewardData.prev = rewardRow.cur;
    if (rewardData.cur < rewardData.prev) rewardData.cur = rewardData.prev;

    rewardData.forge = "0";
    for (const block of blocks) {
      if (block === rewardData.prev) break;
      rewardData.forge = (BigInt(rewardData.forge) + BigInt(block.totalForged)).toString();
    }
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