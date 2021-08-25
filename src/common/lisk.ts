import fetch from 'node-fetch';
import { NETWORK, API_URL, DELEGATE, REWARD } from '../common/constats';

export const getMyAccount = async():Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/accounts?username=${DELEGATE.NAME}&isDelegate=true`);
  return (await response.json()).data[0];
}

export const getVotesReceived = async():Promise<any> => {
  const response = await fetch(`${API_URL[NETWORK]}/votes_received?username=${DELEGATE.NAME}&aggregate=true`);
  return (await response.json()).data;
}