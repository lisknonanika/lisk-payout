import mysql from 'mysql2/promise';
import fs from 'fs';
import { OUTPUTDATA } from '../common/type';
import { OUTPUT } from '../common/config';
import { findReward, findVoters, findManage } from '../common/mysql';

export const outputData = async(mysqlConnection:mysql.Connection, filePath:string):Promise<boolean> => {
  try {
    console.info(`[outputData] Start`);

    const data:OUTPUTDATA = {
      reward: { cur: "", prev: "", diff: "" },
      manage: { self: "", pool: "" },
      voter: new Array()
    };

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);
    if (rewardRow) {
      data.reward.cur = rewardRow.cur;
      data.reward.prev = rewardRow.prev;
      data.reward.diff = rewardRow.diff;
    }

    // Get votes_received
    const manageRow = await findManage(mysqlConnection);
    if (manageRow) {
      data.manage.pool = manageRow.pool;
      data.manage.self = manageRow.self;
    }

    // Get: delegate account
    const voterRows = await findVoters(mysqlConnection);
    if (voterRows) {
      data['voter'] = new Array();
      for (const row of voterRows) {
        data.voter.push({ address: row.address, reward: row.reward });
      }
    }

    fs.mkdirSync(OUTPUT.DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return true;

  } catch (err) {
    console.info(`[outputData] System error`);
    console.error(err);
    return true;

  } finally {
    console.info(`[outputData] End`);
  }
}