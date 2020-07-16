const { APIClient, transaction, cryptography} = require("lisk-elements");
const { BigNum } = transaction.utils;
const { MongoClient } = require("mongodb");
const conf = require("../config.json");
const db = require("../db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();
let con = null;

const getMyReward = async(address) => {
    try {
        const liskData = await client.delegates.getForgingStatistics(address);
        const current = liskData.data;
        const dbData = await db.getForged(con);
        if (!dbData) return {current: current.forged, past: "0", diff: current.forged}
        return {current: current.forged, past: dbData.current, diff: new BigNum(current.forged).sub(dbData.current).toString()}
    }catch (err) {
        console.log(err);
        return {current: "0", past: "0", diff: "0"};
    }
}

const getVoteWeight = async(address) => {
    try {
        const liskData = await client.accounts.get({address: address});
        const voteWeight = new BigNum(liskData.data[0].delegate.vote).sub(liskData.data[0].balance).toString();
        return +voteWeight < 0? "0": voteWeight;
    }catch (err) {
        console.log(err);
        return "0";
    }
}

const setVoters = async(address, offset, voters) => {
    try {
        const liskData = await client.voters.get({address: address, offset: offset, limit: 100});
        if (liskData.data.voters.length === 0) return;
        liskData.data.voters.forEach(voter => {
            if (+voter.balance > 0) voters.push(voter);
        });
        if (voters.length < liskData.data.votes) await setVoters(address, offset + 100, voters);
    }catch (err) {
        console.log(err);
    }
}

module.exports = async() => {
    con = await MongoClient.connect(db.config.url, db.config.auth);
    try {
        const address = cryptography.getAddressFromPublicKey(conf.publicKey);
        // // get forged
        const myReward = await getMyReward(address);
        if (myReward.diff === "0") return;

        // // get voteWeight
        const voteWeight = await getVoteWeight(address);
        if (voteWeight === "0") return;

        // get voter
        let tempVoters = [];
        await setVoters(address, 0, tempVoters);
        let voters  = tempVoters.filter((v1, i1, a1) => {return (a1.findIndex((v2) => {return (v1.publicKey === v2.publicKey)}) === i1)});

        // reward * payout rate
        const reward = new BigNum(myReward.diff).mul(conf.rate).toString();

        // update account
        await Promise.all(voters.map(async voter => {
            const voteRate = new BigNum(voter.balance).div(voteWeight).toString();
            const voteReward = Math.trunc(new BigNum(reward).mul(voteRate)).toString();
            if (voter.address !== address && +voteReward > 0) {
                const account = await db.getAccountByPublicKey(con, voter.publicKey);
                const pending = account? new BigNum(voteReward).add(account.pending).toString(): voteReward;
                await db.updateAccount(con, voter.publicKey, pending, false);
            }
        }));

        // update forged
        await db.updateForged(con, myReward.current, myReward.past);
        
    } catch (err) {
        console.log(err);
    } finally {
        if (con && con.isConnected) await con.close();
    }
}
