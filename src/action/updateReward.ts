import fetch from 'node-fetch';
import mysql from 'mysql2/promise';
// import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { NETWORK, API_URL, DELEGATE } from '../common/constats';

export const updateReward = async(mysqlConnection:mysql.Connection) => {
    try {
        // Get delegate account
        // const responseAccount = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
        // const account = (await responseAccount.json()).data[0];
        // console.log(account);

        // Select reward
        const [reward] = await mysqlConnection.query('SELECT * FROM `reward` WHERE `id` = ?', [NETWORK]);
        console.log(reward);

        // data.rewards.prev = data.rewards.current;
        // data.rewards.current = account.dpos.delegate.rewards;
        // data
        return true;

    } catch (err) {
        console.info(`[updateReward] System error`);
        console.error(err);
        return false;
    }
}