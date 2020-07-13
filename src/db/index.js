const { MongoClient } = require("mongodb");
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

module.exports.getAccountByAddress = async(address) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.accounts);
        const data = await tbl.findOne({address: address});
        return data;
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}

module.exports.updateAccount = async(address, pending, isPayout) => {
    const con = await MongoClient.connect(conf.url, conf.auth);
    try {
        const db = await con.db(conf.auth.authSource);
        const tbl = await db.collection(conf.collection.forged);
        const param = isPayout? { $set: { pending: "0", latestPayoutDate: new Date() } }: { $set: { pending: pending } };
        await tbl.updateOne({ address: address }, param, { upsert: true });
    } catch (err) {
        console.log(err);
    } finally {
        con.close();
    }
}
