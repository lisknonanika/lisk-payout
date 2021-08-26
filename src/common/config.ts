export const NETWORK:number = 1;    // 0:Mainnet, 1:Testnet

export const API_URL:string[] = [
  "https://service.lisk.com/api/v2",
  "https://testnet-service.lisk.com/api/v2",
];
export const WS_URL:string[] = [
  "wss://mainnet-service.ysdev.work/ws",
  "wss://testnet-service.ysdev.work/ws",
];

export const DELEGATE = {
  NAME: "ysdev",
  ADDRESS: "lskysdevwuzkpjav7q8umak8nn68n5sd6xx5j7cys",
  POOLADDRESS: "lskjp2fudfamk2tybjn9ohjp3z6wdecjmb8d8bds4",
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