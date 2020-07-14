const { APIClient, transaction, cryptography} = require("lisk-elements");
const { utils } = transaction;
const { BigNum } = utils;
const conf = require("../config.json");
const db = require("../db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

module.exports = async() => {
    const minimum = utils.convertLSKToBeddows(conf.minimum.toString());
    const targets = await db.getAccountOfPayoutTarget(minimum);
    targets.forEach(async t => {
        try {
            const tx = transaction.transfer({
                amount: new BigNum(t.pending).sub(utils.convertLSKToBeddows(conf.fee.toString())).toString(),
                recipientId: cryptography.getAddressFromPublicKey(t.publicKey),
                data: conf.message,
                passphrase: conf.passphrase,
                secondPassphrase: conf.secondPassphrase,
            });
            await client.transactions.broadcast(tx);
            await db.updateAccount(t.publicKey, "0", true);

            // sleep 1 minutes
            await sleep(1000);
        } catch (err) {
            console.log(err);
        }
    });
}