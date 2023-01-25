import mysql from 'mysql2/promise';
import fs from 'fs';
import { OUTPUTDATA } from '../common/type';
import { OUTPUT, NETWORK } from '../common/config';
import { findReward, findVoters, findManage } from '../common/mysql';

export const outputData = async (mysqlConnection: mysql.Connection, filePath: string): Promise<boolean> => {
  try {
    console.info(`[outputData] Start`);

    const data: OUTPUTDATA = {
      reward: { cur: 0, prev: 0, forge: "" },
      manage: { self: "", pool: "" },
      voter: new Array()
    };

    // Find: Reward
    const rewardRow = await findReward(mysqlConnection);
    if (rewardRow) {
      data.reward.cur = rewardRow.cur;
      data.reward.prev = rewardRow.prev;
      data.reward.forge = rewardRow.forge;
    }

    // Find: Manage
    const manageRow = await findManage(mysqlConnection);
    if (manageRow) {
      data.manage.pool = manageRow.pool;
      data.manage.self = manageRow.self;
    }

    // Find: Voters
    const voterRows = await findVoters(mysqlConnection);
    if (voterRows) {
      data['voter'] = new Array();
      for await (const row of voterRows) {
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


export const outputRecoverySQL = async (mysqlConnection: mysql.Connection, filePath: string): Promise<boolean> => {
  try {
    console.info(`[outputRecoverySQL] Start`);

    fs.mkdirSync(OUTPUT.DIR, { recursive: true });

    // Find: Voters
    const voterRows = await findVoters(mysqlConnection);
    if (voterRows) {
      for (let i = 0; i < voterRows.length; i++) {
        if (i === 0) {
          fs.writeFileSync(filePath, `UPDATE voter SET reward='${voterRows[i].reward}' WHERE id=${NETWORK} and address='${voterRows[i].address}';\n`);
        } else {
          fs.appendFileSync(filePath, `UPDATE voter SET reward='${voterRows[i].reward}' WHERE id=${NETWORK} and address='${voterRows[i].address}';\n`);
        }
      }
    }
    return true;

  } catch (err) {
    console.info(`[outputRecoverySQL] System error`);
    console.error(err);
    return true;

  } finally {
    console.info(`[outputRecoverySQL] End`);
  }
}