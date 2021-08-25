export const NETWORK:number = 1;    // 0:Mainnet, 1:Testnet

export const API_URL:string[] = [
    "https://service.lisk.com/api/v2",
    "https://testnet-service.lisk.com/api/v2",
];

export const DELEGATE = {
    NAME: "ysdev",
    ADDRESS: "lsk4u6zpqzzotweghzkyuqjmyeujbna5pkxm99vdt",
    MULTI_SIGNATURE: false,
    PASS_PHRASE: [
        ""
    ],
    RATE: 0.5,
    FEE: "300000"
}

export interface REWARD {
    id:number;
    current:string;
    prev:string;
    diff:string;
}

export interface VOTER {
    address:string;
    reward:string;
}

export interface HISTORU {
    address:string;
    reward:string;
    timestamp:bigint;
}