const { APIClient, transaction, cryptography} = require("lisk-elements");
const { utils } = transaction;
const { BigNum } = utils;
const { MongoClient } = require("mongodb");
const conf = require("../config.json");
const db = require("../db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();
let con = null;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

module.exports = async() => {
    con = await MongoClient.connect(db.config.url, db.config.auth);
    try {
        const minimum = utils.convertLSKToBeddows(conf.minimum.toString());
        const targets = await db.getAccountOfPayoutTarget(con, minimum);
        await Promise.all(targets.map(async t => {
                const tx = transaction.transfer({
                    amount: new BigNum(t.pending).sub(utils.convertLSKToBeddows(conf.fee.toString())).toString(),
                    recipientId: cryptography.getAddressFromPublicKey(t.publicKey),
                    data: conf.message,
                    passphrase: conf.passphrase,
                    secondPassphrase: conf.secondPassphrase,
                });
                await client.transactions.broadcast(tx);
                await db.updateAccount(con, t.publicKey, "0", true);

                // sleep 0.5 minutes
                await sleep(500);
        }));
    } catch (err) {
        console.log(err);
    } finally {
        if (con && con.isConnected) await con.close();
    }
}