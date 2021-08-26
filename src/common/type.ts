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

export interface OUTPUTDATA {
  reward: {
    cur:string;
    prev:string;
    diff:string;
  },
  manage: {
    self:string;
    pool:string;
  },
  voter: Array<{
    address:string;
    reward:string;
  }>
}