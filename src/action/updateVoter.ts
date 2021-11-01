import mysql from 'mysql2/promise';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { VOTER } from '../common/type';
import { NETWORK, DELEGATE } from '../common/config';
import { getMyAccount, getVotesReceived } from '../common/lisk';
import { findReward, findVoter, updVoter } from '../common/mysql';

export const updateVoter = async(mysqlConnection:mysql.Connection):Promise<boolean> => {
  try {
    console.info(`[updateVoter] Start`);

    // Find: reward
    const rewardRow = await findReward(mysqlConnection);
    if (!rewardRow || +convertBeddowsToLSK(rewardRow.forge) <= 0) return true;
    const rewardTarget:number = rewardRow? +convertBeddowsToLSK(rewardRow.forge) * DELEGATE.RATE.VOTER: 0;
    console.info(`[updateVoter] rewardTarget=${rewardTarget}`);

    // Get: delegate account
    const account = await getMyAccount();

    // Get votes_received
    const votesReceived = await getVotesReceived();

    // Calculation: totalVotesReceived
    const selfVote = account.dpos.sentVotes.find((v:any) => { return v.delegateAddress === DELEGATE.ADDRESS });
    const totalVotesReceived:number = +convertBeddowsToLSK((BigInt(account.dpos.delegate.totalVotesReceived) - BigInt(selfVote.amount)).toString());
    console.info(`[updateVoter] totalVotesReceived=${totalVotesReceived}`);
    if (totalVotesReceived <= 0) return true;

    // Main
    for (const voter of votesReceived.votes) {
        if (voter.address === DELEGATE.ADDRESS) continue;
        let reward:number = rewardTarget * (+convertBeddowsToLSK(voter.amount) / totalVotesReceived);
        reward = Math.floor(reward * 100000000) / 100000000;
        console.info(`[updateVoter] address=${voter.address}, reward=${reward}`);

        // Finde: voter
        const voterRow = await findVoter(mysqlConnection, voter.address);

        // Update: Vorter data
        const voterData:VOTER = { id: NETWORK, address: voter.address, reward: convertLSKToBeddows(reward.toString()) };
        if (voterRow) voterData.reward = (BigInt(voterRow.reward) + BigInt(convertLSKToBeddows(reward.toString()))).toString();
        await updVoter(mysqlConnection, voterRow !== undefined, voterData);
    }
    return true;

  } catch (err) {
    console.info(`[updateVoter] System error`);
    console.error(err);
    return false;

  } finally {
    console.info(`[updateVoter] End`);
  }
}