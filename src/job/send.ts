import { NETWORK } from '../common/config';
import { getLiskClient } from '../common/lisk';

export const send = async() => {
  let isError = false;
  let client = undefined;
  try {
    console.info(`[lisk-payout] Send Start: NETWORK=${NETWORK}`);
    
    // get connection
    client = await getLiskClient();
    if (!client) {
      isError = true;
      return;
    }

  } catch (err) {
    console.info(`[lisk-payout] Send System error`);
    isError = true;
    console.error(err);
    
  } finally {
    if (client) await client.disconnect();
    console.info(`[lisk-payout] Send End: NETWORK=${NETWORK}`);
  }
}