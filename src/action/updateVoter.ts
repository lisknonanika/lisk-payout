import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { NETWORK, API_URL, DELEGATE, VOTER } from '../common/constats';

export const updateVoter = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    // Find: reward
    let rewardTarget:number = 0;
    const [rewardRows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await mysqlConnection.query('SELECT * FROM `reward` WHERE `id` = ?', [NETWORK]);
    rewardRows.forEach((row) => {
      rewardTarget = +convertBeddowsToLSK(row.diff) * DELEGATE.RATE.VOTER;
    });
    console.info(`rewardTarget=${rewardTarget}`);
    if (rewardTarget <= 0) return true;

    // Get: delegate account
    const responseAccount = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
    const account = (await responseAccount.json()).data[0];

    // Get votes_received
    const responseVotesReceived = await fetch(`${API_URL[NETWORK]}/votes_received?username=${DELEGATE.NAME}&aggregate=true`);
    const votesReceived = (await responseVotesReceived.json()).data;

    // Calculation: totalVotesReceived
    const selfVote = account.dpos.sentVotes.find((v:any) => { return v.delegateAddress === DELEGATE.ADDRESS });
    const totalVotesReceived:number = +convertBeddowsToLSK(account.dpos.delegate.totalVotesReceived) - +convertBeddowsToLSK(selfVote.amount);
    console.info(`totalVotesReceived=${totalVotesReceived}`);

    // Main
    for (const voter of votesReceived.votes) {
        if (voter.address === DELEGATE.ADDRESS) continue;
        const reward:number = rewardTarget * (+convertBeddowsToLSK(voter.amount) / totalVotesReceived);

        // Initial setting: Reward data
        const voterData:VOTER = {
          id: NETWORK,
          address: voter.address,
          reward: convertLSKToBeddows((Math.floor(reward * 100000000) / 100000000).toString())
        };
        console.info(`address=${voterData.address}, reward=${convertBeddowsToLSK(voterData.reward)}`);

        // Finde: voter
        const [rewardRows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await mysqlConnection.query('SELECT * FROM `voter` WHERE `id` = ? AND `address` = ?', [NETWORK, voter.address]);
        rewardRows.forEach((row) => {
          voterData.reward = convertLSKToBeddows((Math.floor((+convertBeddowsToLSK(row.reward) + reward) * 100000000) / 100000000).toString());
        });

        // Update: Vorter data
        if (rewardRows.length > 0) {
          await mysqlConnection.query('UPDATE `voter` SET ? WHERE `id` = ? AND `address` = ?', [voterData, NETWORK, voter.address]);
        } else {
          await mysqlConnection.query('INSERT INTO `voter` SET ?', voterData);
        }
    }

    return true;

  } catch (err) {
    console.info(`[updateVoter] System error`);
    console.error(err);
    return false;
  }
}