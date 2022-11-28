export const NETWORK:number = 1;    // 0:Mainnet, 1:Testnet

export const API_URL:string[] = [
  "https://service.lisk.com/api/v2",
  "https://testnet-service.lisk.com/api/v2",
];
export const API_MY_URL:string[] = [
  "https://mainnet-service.liskcommulab.jp/api/v2",
  "https://testnet-service.liskcommulab.jp/api/v2",
];
export const API_RETRY_URL:string[] = [
  "https://mainnet-service.lisktools.eu/api/v2",
  "https://testnet-service.lisktools.eu/api/v2",
];

export const DB_PARAMS = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'payout'
}

export const DELEGATE = {
  NAME: "ysdev",
  ADDRESS: "lskysdevwuzkpjav7q8umak8nn68n5sd6xx5j7cys",
  POOLADDRESS: "lskjp2fudfamk2tybjn9ohjp3z6wdecjmb8d8bds4",
  MULTISIG: true,
  PASSPHRASE: [
    "",
    ""
  ],
  RATE: {
    VOTER: 0.5,
    SELF: 0.3,
    POOL: 0.2
  },
  MINIMUMPAY: {
    VOTER: 1,
    SELF: 110,
    POOL: 110
  },
  MESSAGE: ""
}

export const CRON = {
  UPDATE: "0 0 */6 * * 1-5",
  SEND: "0 0 1 * * 6",
  MANAGE: "0 0 13 * * 6"
}

export const OUTPUT = {
  DIR: "../output/",
  FILE: "lisk-payout-testnet.json"
}