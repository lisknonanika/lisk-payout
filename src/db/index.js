const { transaction } = require("lisk-elements");
const { BigNum } = transaction.utils;
const conf = require("./mongo_config.json");

module.exports.getPwd = async(con) => {
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.pwd);
        const data = await tbl.findOne();
        return data;
    } catch (err) {
        console.log(err);
    }
}

module.exports.getForged = async(con) => {
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.forged);
        const data = await tbl.findOne();
        return data;
    } catch (err) {
        console.log(err);
    }
}

module.exports.updateForged = async(con, current, past) => {
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.forged);
        await tbl.updateOne({}, { $set: { current: current, past: past } }, { upsert: true });
    } catch (err) {
        console.log(err);
    }
}

module.exports.getAccountByPublicKey = async(con, publicKey) => {
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const data = await tbl.findOne({publicKey: publicKey});
        return data;
    } catch (err) {
        console.log(err);
    }
}

module.exports.getAccountOfPayoutTarget = async(con, minimum) => {
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
    }
}

module.exports.updateAccount = async(con, publicKey, pending, isPayout) => {
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const param = isPayout? { $set: { pending: "0", latestPayoutDate: new Date() } }: { $set: { pending: pending } };
        await tbl.updateOne({ publicKey: publicKey }, param, { upsert: true });
    } catch (err) {
        console.log(err);
    }
}

module.exports.config = conf;