import fs from 'fs';
import fetch from 'node-fetch';
import { convertBeddowsToLSK, convertLSKToBeddows } from '@liskhq/lisk-transactions';
import { API_URL, DATA_FILE_PATH, DELEGATE, DATA, RATE } from './common/constats';

(async() => {
    try {
        let data:DATA = {
            rewards: {
                current: "0",
                prev: "0"
            },
            voters: []
        };
        if (!fs.existsSync(DATA_FILE_PATH)) {
            fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data), 'utf-8');
        }
        data = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));

        // Get account
        const responseAccount = await fetch(`${API_URL}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
        const account = (await responseAccount.json()).data[0];
        const rewards:string = account.dpos.delegate.rewards;
        data.rewards.prev = data.rewards.current;
        data.rewards.current = rewards;
        
        // Get votes_received
        const responseVotesReceived = await fetch(`${API_URL}/votes_received?username=${DELEGATE.NAME}&aggregate=true`);
        const votesReceived = (await responseVotesReceived.json()).data;
        
        // update
        const selfVote = account.dpos.sentVotes.find((v:any) => { return v.delegateAddress === DELEGATE.ADDRESS });
        const totalVotesReceived:bigint = BigInt(account.dpos.delegate.totalVotesReceived) - BigInt(selfVote.amount);
        const totalReward:number = (+convertBeddowsToLSK(data.rewards.current) - +convertBeddowsToLSK(data.rewards.prev)) * RATE;
        for (const voter of votesReceived.votes) {
            if (voter.address === DELEGATE.ADDRESS) continue;
            const reward:number = totalReward * +convertBeddowsToLSK(voter.amount) / +convertBeddowsToLSK(totalVotesReceived.toString());
            const v = data.voters.find((v:any) => { return v.address === voter.address; });
            if (v) {
                v.reward = convertLSKToBeddows((Math.floor((+convertBeddowsToLSK(v.reward) + reward) * 100000000) / 100000000).toString());
                continue;
            }
            data.voters.push({
                address: voter.address,
                reward: convertLSKToBeddows((Math.floor(reward * 100000000) / 100000000).toString())
            });
        }

        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data), 'utf-8');
        
    } catch (err) {
        console.error(err);
    }
})();