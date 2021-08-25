import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
// import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { NETWORK, API_URL, DELEGATE, REWARD } from '../common/constats';

export const updateReward = async(mysqlConnection:mysql.Connection) => {
  try {
    // Get: delegate account
    const responseAccount = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
    const account = (await responseAccount.json()).data[0];

    // Initial setting: Reward data
    const rewardData:REWARD = {
      id: NETWORK,
      cur: account.dpos.delegate.rewards,
      prev: account.dpos.delegate.rewards,
      diff: "0"
    }

    // Find: reward
    const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await mysqlConnection.query('SELECT * FROM `reward` WHERE `id` = ?', [NETWORK]);
    rows.forEach((row) => {
      rewardData.prev = row.cur;
    });

    // Update: Reward data
    rewardData.diff = (BigInt(rewardData.cur) - BigInt(rewardData.prev)).toString();
    if (rows.length > 0) {
      await mysqlConnection.query('UPDATE `reward` SET ? WHERE `id` = ?', [rewardData, NETWORK]);
    } else {
      await mysqlConnection.query('INSERT INTO `reward` SET ?', rewardData);
    }

    return true;

  } catch (err) {
    console.info(`[updateReward] System error`);
    console.error(err);
    return false;
  }
}