import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { MANAGE } from '../common/type';
import { NETWORK, DELEGATE } from '../common/config';
import { findReward, findManage, updManage } from '../common/mysql';

export const updateManage = async (mysqlConnection: mysql.Connection): Promise<boolean> => {
  try {
    console.info(`[updateManage] Start`);

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);
    if (!rewardRow || +convertBeddowsToLSK(rewardRow.forge) <= 0) return true;
    let selefTarget: number = rewardRow && DELEGATE.RATE.SELF > 0 ? +convertBeddowsToLSK(rewardRow.forge) * DELEGATE.RATE.SELF : 0;
    if (selefTarget > 0) selefTarget = Math.floor(selefTarget * 100000000) / 100000000;
    let poolTarget: number = rewardRow && DELEGATE.RATE.POOL > 0 ? +convertBeddowsToLSK(rewardRow.forge) * DELEGATE.RATE.POOL : 0;
    if (poolTarget > 0) poolTarget = Math.floor(poolTarget * 100000000) / 100000000;
    console.info(`[updateManage] selefTarget=${selefTarget}, poolTarget=${poolTarget}`);

    // Find: manage
    const manageRow = await findManage(mysqlConnection);

    // Update: Manage data
    const manageData: MANAGE = { id: NETWORK, self: "0", pool: "0" };
    if (manageRow) {
      manageData.self = selefTarget > 0 ? (BigInt(manageRow.self) + BigInt(convertLSKToBeddows(selefTarget.toString()))).toString() : manageRow.self;
      manageData.pool = poolTarget > 0 ? (BigInt(manageRow.pool) + BigInt(convertLSKToBeddows(poolTarget.toString()))).toString() : manageData.pool;
    } else {
      manageData.self = selefTarget > 0 ? convertLSKToBeddows(selefTarget.toString()) : "0";
      manageData.pool = poolTarget > 0 ? convertLSKToBeddows(poolTarget.toString()) : "0";
    }
    await updManage(mysqlConnection, manageRow !== undefined, manageData);
    return true;

  } catch (err) {
    console.info(`[updateManage] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[updateManage] End`);
  }
}