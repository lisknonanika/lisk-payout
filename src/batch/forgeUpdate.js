const { APIClient, transaction, cryptography} = require("lisk-elements");
const { BigNum } = transaction.utils;
const conf = require("./batchConfig.json")
const db = require("../db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();

const getMyReward = async(address) => {
    try {
        const liskData = await client.delegates.getForgingStatistics(address);
        const current = liskData.data;
        const dbData = await db.getForged();
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
        liskData.data.voters.forEach(voter => voters.push(voter));
        if (voters.length < liskData.data.votes) await setVoters(address, offset + 100, voters);
    }catch (err) {
        console.log(err);
    }
}

(async() => {
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
        voters.forEach(async voter => {
            const voteRate = new BigNum(voter.balance).div(voteWeight).toString();
            const voteReward = Math.trunc(new BigNum(reward).mul(voteRate)).toString();
            const account = await db.getAccountByPublicKey(voter.publicKey);
            const pending = account? new BigNum(voteReward).add(account.pending).toString(): voteReward;
            await db.updateAccount(voter.publicKey, pending, false);
        });

        // update forged
        await db.updateForged(myReward.current, myReward.past);

    } catch (err) {
        console.log(err);
    }
})();
