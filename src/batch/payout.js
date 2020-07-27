const { APIClient, transaction, cryptography} = require("lisk-elements");
const { utils } = transaction;
const { BigNum } = utils;
const { MongoClient } = require("mongodb");
const CryptoJS = require("crypto-js");
const conf = require("../config.json");
const db = require("../db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();
let con = null;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

const getKeys = (password) => {
    const gen = CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(password));
    const iv = CryptoJS.enc.Utf8.parse(gen.slice(0, 32));
    const key = CryptoJS.enc.Utf8.parse(gen.slice(-32));
    return {
        "iv": iv,
        "key": key
    }
}

const cipher = (plainText, password) => {
    try {
        const keys = getKeys(password);
        const val = CryptoJS.enc.Utf8.parse(plainText);
        const encrypted = CryptoJS.AES.encrypt(val, keys.key, {
            iv: keys.iv,
            mode: CryptoJS.mode.CBC, 
            adding: CryptoJS.pad.Pkcs7
        });
        return encrypted.ciphertext.toString();
    } catch (err) {
        return "";
    }
}

const decipher = (cipherText, password) => {
    try {
        const keys = getKeys(password);
        const val = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(cipherText));
        const decrypt = CryptoJS.AES.decrypt(val, keys.key, {
            iv: keys.iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypt.toString(CryptoJS.enc.Utf8);
    } catch (err) {
        return "";
    }
}

module.exports = async() => {
    con = await MongoClient.connect(db.config.url, db.config.auth);
    try {
        const pwdData = await db.getPwd(con);
        const minimum = utils.convertLSKToBeddows(conf.minimum.toString());
        const targets = await db.getAccountOfPayoutTarget(con, minimum);
        for(t of targets){
            const tx = transaction.transfer({
                amount: new BigNum(t.pending).sub(utils.convertLSKToBeddows(conf.fee.toString())).toString(),
                recipientId: cryptography.getAddressFromPublicKey(t.publicKey),
                data: conf.message,
                passphrase: decipher(conf.passphrase, pwdData.pwd),
                secondPassphrase: decipher(conf.secondPassphrase, pwdData.pwd),
            });
            await client.transactions.broadcast(tx);
            await db.updateAccount(con, t.publicKey, "0", true);

            // sleep 1 minutes
            await sleep(1000);
        }
    } catch (err) {
        console.log(err);
    } finally {
        if (con && con.isConnected) await con.close();
    }
}