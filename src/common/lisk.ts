import fetch from 'node-fetch';
import { NETWORK, API_URL, WS_URL, DELEGATE } from './config';
import { apiClient, cryptography, transactions } from '@liskhq/lisk-client';

export const getLiskClient = async():Promise<apiClient.APIClient|undefined> => {
  try {
    return await apiClient.createWSClient(WS_URL[NETWORK]);
    
  } catch(err) {
    console.error(err);
    return undefined;
  }
}

export const getMyAccount = async():Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
  return (await response.json()).data[0];
}

export const getVotesReceived = async():Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/votes_received?username=${DELEGATE.NAME}&aggregate=true`);
  return (await response.json()).data;
}

export const transfer = async(client:apiClient.APIClient, recipientAddress:string) => {
  // Get: Delegate account
  const account:Record<string, any> = await client.account.get(cryptography.getAddressFromLisk32Address(DELEGATE.ADDRESS));
  if (!account) return;

  // Get: NetworkIdentifier
  const networkIdentifier = (await client.node.getNodeInfo()).networkIdentifier;
  if (!networkIdentifier) return;

  // Get: Schema
  const assetSchema = client.schemas.transactionsAssets.find((schema) => schema.moduleID === 2 && schema.assetID === 0);
  if (!assetSchema) return;

  // Set: param
  const transferparam = {
    moduleID: 2,
    assetID: 0,
    fee: BigInt(100000000),
    senderPublicKey: cryptography.getPrivateAndPublicKeyFromPassphrase(DELEGATE.PASSPHRASE[0]).publicKey,
    asset: {
      amount: BigInt(100000000),
      recipientAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
      data: DELEGATE.MESSAGE
    }
  }

  const multisignatureKeys = {
    mandatoryKeys: account.keys.mandatoryKeys,
    optionalKeys: account.keys.optionalKeys
  }

  // Get: MinFee
  let tx:Record<string, any> = await client.transaction.create(
    transferparam,
    DELEGATE.PASSPHRASE[0],
    {
      includeSenderSignature: false,
      multisignatureKeys: multisignatureKeys
    }
  );
  tx.fee = await client.transaction.computeMinFee(tx);
  tx.asset.amount = tx.asset.amount - tx.fee;

  // Sign: Transaction
  if (DELEGATE.PASSPHRASE.length < 2) {
    tx = transactions.signTransaction(
      assetSchema.schema,
      tx,
      Buffer.from(networkIdentifier, "hex"),
      DELEGATE.PASSPHRASE[0]
    )
  } else {
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
  }

  // Send: Transaction
  console.log(await client.transaction.send(tx));
}