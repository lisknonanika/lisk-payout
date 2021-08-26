import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { MANAGE } from '../common/type';
import { NETWORK, DELEGATE } from '../common/config';
import { findReward, findManage, updManage } from '../common/mysql';

export const updateManage = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateManage] Start`);

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);
    if (!rewardRow || +convertBeddowsToLSK(rewardRow.diff) <= 0) return true;
    let selefTarget:number = rewardRow? +convertBeddowsToLSK(rewardRow.diff) * DELEGATE.RATE.SELF: 0;
    selefTarget = Math.floor(selefTarget * 100000000) / 100000000;
    let poolTarget:number = rewardRow? +convertBeddowsToLSK(rewardRow.diff) * DELEGATE.RATE.POOL: 0;
    poolTarget = Math.floor(poolTarget * 100000000) / 100000000;
    console.info(`[updateManage] selefTarget=${selefTarget}, poolTarget=${poolTarget}`);

    // Find: manage
    const manageRow = await findManage(mysqlConnection);

    // Update: Manage data
    const manageData:MANAGE = { id: NETWORK, self: "0", pool: "0" };
    if(manageRow) {
      manageData.self = convertLSKToBeddows((+convertBeddowsToLSK(manageRow.self) + selefTarget).toString());
      manageData.pool = convertLSKToBeddows((+convertBeddowsToLSK(manageRow.pool) + poolTarget).toString());
    } else {
      manageData.self = convertLSKToBeddows(selefTarget.toString());
      manageData.pool = convertLSKToBeddows(poolTarget.toString())
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