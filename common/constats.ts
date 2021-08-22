export const API_URL:string = "https://testnet-service.lisk.io/api/v2"
export const DATA_FILE_PATH:string = "./data/data.json";
export const RATE:number = 0.6;
export const FEE:number = 0.003;
export const DELEGATE = {
    NAME: "ysdev",
    ADDRESS: "lskysdevwuzkpjav7q8umak8nn68n5sd6xx5j7cys",
    MULTI_SIGNATURE: false,
    PASS_PHRASE: [
        ""
    ]
}

export interface DATA_REWARDS {
    current:string;
    prev:string;
}

export interface DATA_VOTER {
    address:string;
    reward:string;
}

export interface DATA {
    rewards:DATA_REWARDS;
    voters:DATA_VOTER[];
}