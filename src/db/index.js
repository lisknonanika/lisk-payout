const { MongoClient } = require("mongodb");
const { transaction } = require("lisk-elements");
const { BigNum } = transaction.utils;
const conf = require("./mongo_config.json");

module.exports.getForged = async() => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.forged);
        const data = await tbl.findOne();
        return data;
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}

module.exports.updateForged = async(current, past) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.forged);
        await tbl.updateOne({}, { $set: { current: current, past: past } }, { upsert: true });
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}

module.exports.getAccountByPublicKey = async(publicKey) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const data = await tbl.findOne({publicKey: publicKey});
        return data;
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}

module.exports.getAccountOfPayoutTarget = async(minimum) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const data = await tbl.find({}).toArray();
        const ret = [];
        data.forEach(d => {
            if (new BigNum(d.pending).sub(minimum) >= 0) ret.push(d);
        });
        return ret;
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}

module.exports.updateAccount = async(publicKey, pending, isPayout) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const param = isPayout? { $set: { pending: "0", latestPayoutDate: new Date() } }: { $set: { pending: pending } };
        await tbl.updateOne({ publicKey: publicKey }, param, { upsert: true });
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}
