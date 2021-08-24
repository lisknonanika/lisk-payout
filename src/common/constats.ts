export const API_URL:string = "https://mainnet-service.ysdev.work/api/v2"
export const DATA_FILE_PATH:string = "./data/data.json";
export const RATE:number = 0.6;
export const FEE:number = 0.003;
export const DELEGATE = {
    NAME: "liskjapan",
    ADDRESS: "lsk4u6zpqzzotweghzkyuqjmyeujbna5pkxm99vdt",
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