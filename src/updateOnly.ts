import mysql from 'mysql2/promise';
import { isTargetTransfer } from './common/lisk';
import { findRewardTargetVoters, updVoter, getMysqlConnection } from './common/mysql';
import { NETWORK, DELEGATE } from './common/config';

export const updateVoterTable = async (): Promise<boolean> => {
  let isError = false;
  let mysqlConnection: mysql.Connection | undefined = undefined;
  try {
    console.info(`[lisk-payout] UpdateOnly Start: NETWORK=${NETWORK}`);
    if (DELEGATE.RATE.VOTER <= 0) return false;

    // get mysql connection
    mysqlConnection = await getMysqlConnection();
    if (!mysqlConnection) {
      console.info(`[lisk-payout] UpdateOnly DB Connection Error.`);
      isError = true;
      return false;
    }

    // Find: voters (before)
    const beforeVoters = await findRewardTargetVoters(mysqlConnection);
    if (!beforeVoters || beforeVoters.length === 0) {
      console.info(`[lisk-payout] UpdateOnly Target Not Found.`);
      return false;
    }

    // Update: voters
    for await (const voter of beforeVoters) {
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
    console.info(`[lisk-payout] UpdateOnly System error`);
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
    console.info(`[lisk-payout] UpdateOnly End: NETWORK=${NETWORK}`);
  }
}

(async () => {
  try {
    await updateVoterTable();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
