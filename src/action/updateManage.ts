import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { NETWORK, DELEGATE, MANAGE } from '../common/constats';

export const updateManage = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    // Find: reward
    let selefTarget:number = 0;
    let poolTarget:number = 0;
    const [rewardRows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await mysqlConnection.query('SELECT * FROM `reward` WHERE `id` = ?', [NETWORK]);
    rewardRows.forEach((row) => {
      selefTarget = +convertBeddowsToLSK(row.diff) * DELEGATE.RATE.SELF;
      poolTarget = +convertBeddowsToLSK(row.diff) * DELEGATE.RATE.POOL;
    });
    console.info(`selefTarget=${selefTarget}, poolTarget=${poolTarget}`);
    if (selefTarget <= 0 && poolTarget <= 0) return true;

    // Initial setting: Manage data
    const manageData:MANAGE = {
      id: NETWORK,
      self: convertLSKToBeddows((Math.floor(selefTarget * 100000000) / 100000000).toString()),
      pool: convertLSKToBeddows((Math.floor(poolTarget * 100000000) / 100000000).toString())
    }

    // Find: manage
    const [manageRows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await mysqlConnection.query('SELECT * FROM `manage` WHERE `id` = ?', [NETWORK]);
    manageRows.forEach((row) => {
      manageData.self = convertLSKToBeddows((Math.floor((+convertBeddowsToLSK(row.self) + selefTarget) * 100000000) / 100000000).toString());
      manageData.pool = convertLSKToBeddows((Math.floor((+convertBeddowsToLSK(row.pool) + poolTarget) * 100000000) / 100000000).toString());
    });

    // Update: Manage data
    if (manageRows.length > 0) {
      await mysqlConnection.query('UPDATE `manage` SET ? WHERE `id` = ?', [manageData, NETWORK]);
    } else {
      await mysqlConnection.query('INSERT INTO `manage` SET ?', manageData);
    }

    return true;

  } catch (err) {
    console.info(`[updateManage] System error`);
    console.error(err);
    return false;
  }
}