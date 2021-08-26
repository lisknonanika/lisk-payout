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