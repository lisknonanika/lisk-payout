import fetch from 'node-fetch';
import { NETWORK, API_URL, DELEGATE } from './config';
import { cryptography, transactions } from '@liskhq/lisk-client';

export const getMyAccount = async():Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true&limit=1&offset=0`);
  return (await response.json()).data[0];
}

export const getTransferTransaction = async(sender:string, recipient:string):Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/transactions?senderAddress=${sender}&recipientAddress=${recipient}&limit=1&offset=0`);
  return (await response.json()).data;
}

export const getForgedBlocks = async(height:number):Promise<any> => {
  const data = new Array();
  return await getForgedBlocksNext(height, data, 0);
}

const getForgedBlocksNext = async(height:number, data: Array<any>, offset:number):Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/blocks?generatorUsername=${DELEGATE.NAME}&limit=100&offset=${offset}`);
  const json = await response.json();
  if (!json.data) return data;

  let minHeight = 0;
  for (const block of json.data) {
    minHeight = block.height;
    if (height < minHeight) data.push(block);
  }
  if (height < minHeight) await getForgedBlocksNext(height, data, offset+100);
  return data;
}

export const getVotesReceived = async():Promise<any> => {
  const data = { votes: new Array()}
  return await getVotesReceivedNext(data, 0);
}

const getVotesReceivedNext = async(data:{ votes: Array<any>}, offset:number):Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/votes_received?username=${DELEGATE.NAME}&aggregate=true&limit=100&offset=${offset}`);
  const json = await response.json();
  if (!json.data.votes) return data;
  for (const vote of json.data.votes) data.votes.push(vote);
  if (data.votes.length < json.meta.total) await getVotesReceivedNext(data, offset+100);
  return data;
}

const getNetworkId = async():Promise<string> => {
  const response = await fetch(`${API_URL[NETWORK].slice( 0, -3 )}/status`);
  return (await response.json()).networkId;
}

const getSchemas = async(moduleAssetId:string):Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/transactions/schemas?moduleAssetId=${moduleAssetId}`);
  return (await response.json()).data[0];
}

export const sendTransaction = async(tx:any, assetSchema:any, isTrasnfer:boolean) => {
  // Get: Delegate account
  const account = await getMyAccount();
  if (!account) return;

  // Get: NetworkIdentifier
  const networkIdentifier = await getNetworkId();
  if (!networkIdentifier) return;

  // Set: MultisignatureKeys
  const multisignatureKeys = {
    mandatoryKeys: account.keys.mandatoryKeys,
    optionalKeys: account.keys.optionalKeys
  }

  // Set: Options
  const options = DELEGATE.MULTISIG? {numberOfSignatures: account.keys.numberOfSignatures}: {};

  // Set: MinFee
  tx.fee = transactions.computeMinFee(assetSchema.schema, tx, options);
  if(isTrasnfer) tx.asset.amount = tx.asset.amount - tx.fee;

  // Sign: Transaction
  if (DELEGATE.MULTISIG) {
    for (const passphrae of DELEGATE.PASSPHRASE) {
      tx = transactions.signMultiSignatureTransaction(
        assetSchema.schema,
        tx,
        Buffer.from(networkIdentifier, "hex"),
        passphrae,
        multisignatureKeys,
        false
      )
    }
  } else {
    tx = transactions.signTransaction(
      assetSchema.schema,
      tx,
      Buffer.from(networkIdentifier, "hex"),
      DELEGATE.PASSPHRASE[0]
    )
  }

  // Send: Transaction
  const payload = cryptography.bufferToHex(transactions.getBytes(assetSchema, tx));
    const res = await fetch(`${API_URL[NETWORK]}/transactions?transaction=${payload}`,{
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
    });
    const json = await res.json();
    console.log(json.transactionId);
}

export const transfer = async(nonce:string, recipientAddress:string, amount:string, message:string):Promise<boolean> => {
  try {
    // Get: Schema
    const assetSchema = await getSchemas('2:0');
    if (!assetSchema) return false;

    // Set: Param
    const transferparam = {
      moduleID: 2,
      assetID: 0,
      nonce: BigInt(nonce),
      fee: BigInt(100000000),
      senderPublicKey: cryptography.getPrivateAndPublicKeyFromPassphrase(DELEGATE.PASSPHRASE[0]).publicKey,
      asset: {
        amount: BigInt(amount),
        recipientAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
        data: message
      }
    }

    // Send: Transaction
    await sendTransaction(transferparam, assetSchema, true);

    return true;

  } catch(err) {
    console.error(err);
    return false;
  }
}

export const delegateVote = async(nonce:string, recipientAddress:string, amount:string):Promise<boolean> => {
  try {
    // Get: Schema
    const assetSchema = await getSchemas('5:1');
    if (!assetSchema) return false;

    // Set: param
    const voteParam = {
      moduleID: 5,
      assetID: 1,
      nonce: BigInt(nonce),
      fee: BigInt(100000000),
      senderPublicKey: cryptography.getPrivateAndPublicKeyFromPassphrase(DELEGATE.PASSPHRASE[0]).publicKey,
      asset: {
        votes :[
          {
            delegateAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
            amount: BigInt(amount)
          }
        ]
      }
    }

    // Send: Transaction
    await sendTransaction(voteParam, assetSchema, false);

    return true;

  } catch(err) {
    console.error(err);
    return false;
  }
}