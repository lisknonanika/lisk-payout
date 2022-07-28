CREATE TABLE payout.reward (
  id int NOT NULL,
  cur int NOT NULL,
  prev int NOT NULL,
  forge varchar(45) NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE payout.voter (
  id int NOT NULL,
  address varchar(45) NOT NULL,
  reward varchar(45) NOT NULL,
  PRIMARY KEY(id, address)
);

CREATE TABLE payout.manage (
  id int NOT NULL,
  self varchar(45) NOT NULL,
  pool varchar(45) NOT NULL,
  PRIMARY KEY(id)
);
