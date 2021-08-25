export const NETWORK:number = 1;    // 0:Mainnet, 1:Testnet

export const API_URL:string[] = [
  "https://service.lisk.com/api/v2",
  "https://testnet-service.lisk.com/api/v2",
];

export const DELEGATE = {
  NAME: "ysdev",
  ADDRESS: "lskysdevwuzkpjav7q8umak8nn68n5sd6xx5j7cys",
  MULTI_SIGNATURE: true,
  PASS_PHRASE: [
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
  }
}

export interface REWARD {
  id:number;
  cur:string;
  prev:string;
  diff:string;
}

export interface VOTER {
  id:number;
  address:string;
  reward:string;
}

export interface MANAGE {
  id:number;
  self:string;
  pool:string;
}