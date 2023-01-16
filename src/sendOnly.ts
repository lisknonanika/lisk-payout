import mysql from 'mysql2/promise';
import { isTargetTransfer } from './common/lisk';
import { findRewardTargetVoters, updVoter, getMysqlConnection } from './common/mysql';
import { NETWORK, DELEGATE } from './common/config';
import { send } from './job';

export const updateVoterTable = async (): Promise<boolean> => {
  let isError = false;
  let mysqlConnection: mysql.Connection | undefined = undefined;
  try {
    console.info(`[lisk-payout] SendOnly Update Start: NETWORK=${NETWORK}`);
    if (DELEGATE.RATE.VOTER <= 0) return false;

    // get mysql connection
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      console.info(`[lisk-payout] SendOnly Update DB Connection Error.`);
      isError = true;
      return false;
    }

    // Find: voters (before)
    const beforeVoters = await findRewardTargetVoters(mysqlConnection);
    if (!beforeVoters || beforeVoters.length === 0) {
      console.info(`[lisk-payout] SendOnly Update Target Not Found.`);
      return false;
    }

    // Update: voters
    for (const voter of beforeVoters) {
      // Check: isTarget
      if (await isTargetTransfer(DELEGATE.ADDRESS, voter.address)) continue;

      // Update: voter
      await updVoter(mysqlConnection, true, { id: voter.id, address: voter.address, reward: "0" });

      // sleep 1 sec.
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Find: voters (after)
    const afterVoters = await findRewardTargetVoters(mysqlConnection);
    return afterVoters !== undefined && afterVoters.length > 0;

  } catch (err) {
    console.info(`[lisk-payout] SendOnly Update System error`);
    isError = true;
    console.error(err);
    return false;

  } finally {
    if (mysqlConnection) {
      if (isError) {
        await mysqlConnection.rollback();
      } else {
        await mysqlConnection.commit();
      }
      await mysqlConnection.end();
    }
    console.info(`[lisk-payout] SendOnly Update End: NETWORK=${NETWORK}`);
  }
}

(async () => {
  try {
    if (!await updateVoterTable()) return;
    await send();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
