import fetch from 'node-fetch';
import { NETWORK, API_URL, API_MY_URL, API_RETRY_URL, DELEGATE } from './config';
import { cryptography, transactions } from '@liskhq/lisk-client';

export const getMyAccount = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true&limit=1&offset=0`);
    const data = (await response.json()).data;
    if (data) return data[0];

  } catch (err) {
    console.error(`[API ERROR] /accounts`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true&limit=1&offset=0`);
  return (await response.json()).data[0];
}

export const getTransferTransaction = async (sender: string, recipient: string): Promise<any> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK]}/transactions?senderAddress=${sender}&recipientAddress=${recipient}&limit=1&offset=0`);
    const data = (await response.json()).data;
    if (data) return data;

  } catch (err) {
    console.error(`[API ERROR] /transactions`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK]}/transactions?senderAddress=${sender}&recipientAddress=${recipient}&limit=1&offset=0`);
  return (await response.json()).data;
}

export const isTargetTransfer = async (sender: string, recipient: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK]}/transactions?senderAddress=${sender}&recipientAddress=${recipient}&limit=1&offset=0`);
    const data = (await response.json()).data;
    if (!data) return true;
    if (data[0].isPending) return false;
    return new Date(data[0].block.timestamp * 1000).toLocaleDateString("ja-JP") !== new Date().toLocaleDateString("ja-JP");

  } catch (err) {
    console.error(`[API ERROR] /transactions (isTargetTransfer)`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK]}/transactions?senderAddress=${sender}&recipientAddress=${recipient}&limit=1&offset=0`);
  const data = (await response.json()).data;
  if (!data) return true;
  if (data[0].isPending) return false;
  return new Date(data[0].block.timestamp * 1000).toLocaleDateString("ja-JP") !== new Date().toLocaleDateString("ja-JP");
}

export const getForgedBlocks = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK]}/blocks?generatorUsername=${DELEGATE.NAME}&offset=0&limit=1`);
    const json = await response.json();
    if (json.meta) return json.meta.total;

  } catch (err) {
    console.error(`[API ERROR] /blocks`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK]}/blocks?generatorUsername=${DELEGATE.NAME}&offset=0&limit=1`);
  const json = await response.json();
  if (json.meta) return json.meta.total;
  return 0;
}

export const getVotesReceived = async (): Promise<any> => {
  const data = { votes: new Array() }
  return await getVotesReceivedNext(data, 0);
}

const getVotesReceivedNext = async (data: { votes: Array<any> }, offset: number): Promise<any> => {
  const response = await fetch(`${API_MY_URL[NETWORK]}/votes_received?username=${DELEGATE.NAME}&aggregate=true&limit=100&offset=${offset}`);
  const json = await response.json();
  if (!json.data.votes) return data;
  for await (const vote of json.data.votes) data.votes.push(vote);
  if (data.votes.length < json.meta.total) await getVotesReceivedNext(data, offset + 100);
  return data;
}

const getNetworkId = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK].slice(0, -3)}/status`);
    return (await response.json()).networkId;

  } catch (err) {
    console.error(`[API ERROR] /status`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK].slice(0, -3)}/status`);
  return (await response.json()).networkId;
}

const getSchemas = async (moduleAssetId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_MY_URL[NETWORK]}/transactions/schemas?moduleAssetId=${moduleAssetId}`);
    return (await response.json()).data[0];

  } catch (err) {
    console.error(`[API ERROR] /transactions/schemas`);
  }

  // retry
  const response = await fetch(`${API_RETRY_URL[NETWORK]}/transactions/schemas?moduleAssetId=${moduleAssetId}`);
  return (await response.json()).data[0];
}

export const sendTransaction = async (tx: any, assetSchema: any, isTrasnfer: boolean): Promise<boolean> => {
  try {
    // Get: Delegate account
    const account = await getMyAccount();
    if (!account) return false;

    // Get: NetworkIdentifier
    const networkIdentifier = await getNetworkId();
    if (!networkIdentifier) return false;

    // Set: Options
    const options = DELEGATE.MULTISIG ? { numberOfSignatures: account.keys.numberOfSignatures } : {};

    // Set: MinFee
    tx.fee = transactions.computeMinFee(assetSchema.schema, tx, options);
    if (isTrasnfer) tx.asset.amount = tx.asset.amount - tx.fee;

    // Sign: Transaction
    if (DELEGATE.MULTISIG) {
      // Set: MultisignatureKeys
      const multisignatureKeys = {
        mandatoryKeys: account.keys.mandatoryKeys.map((key: string) => { return cryptography.hexToBuffer(key) }) || [],
        optionalKeys: account.keys.optionalKeys.map((key: string) => { return cryptography.hexToBuffer(key) }) || [],
      }

      for await (const passphrae of DELEGATE.PASSPHRASE) {
        tx = transactions.signMultiSignatureTransaction(
          assetSchema.schema,
          tx,
          cryptography.hexToBuffer(networkIdentifier),
          passphrae,
          multisignatureKeys,
          false
        )
      }
    } else {
      tx = transactions.signTransaction(
        assetSchema.schema,
        tx,
        cryptography.hexToBuffer(networkIdentifier),
        DELEGATE.PASSPHRASE[0]
      )
    }

    // Send: Transaction
    const payload = cryptography.bufferToHex(transactions.getBytes(assetSchema.schema, tx));
    const res = await fetch(`${API_URL[NETWORK]}/transactions?transaction=${payload}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
    });
    const json = await res.json();
    if (json.transactionId) {
      console.log(json.transactionId);
      return true;
    } else {
      console.log(json.message);
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const transfer = async (nonce: string, recipientAddress: string, amount: string, message: string): Promise<boolean> => {
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
      signatures: [],
      senderPublicKey: cryptography.getPrivateAndPublicKeyFromPassphrase(DELEGATE.PASSPHRASE[0]).publicKey,
      asset: {
        amount: BigInt(amount),
        recipientAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
        data: message
      }
    }

    // Send: Transaction
    return await sendTransaction(transferparam, assetSchema, true);

  } catch (err) {
    console.error(err);
    return false;
  }
}

export const delegateVote = async (nonce: string, recipientAddress: string, amount: string): Promise<boolean> => {
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
      signatures: [],
      senderPublicKey: cryptography.getPrivateAndPublicKeyFromPassphrase(DELEGATE.PASSPHRASE[0]).publicKey,
      asset: {
        votes: [
          {
            delegateAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
            amount: BigInt(amount)
          }
        ]
      }
    }

    // Send: Transaction
    return await sendTransaction(voteParam, assetSchema, false);

  } catch (err) {
    console.error(err);
    return false;
  }
}