const lisk = require("lisk-elements");
const { APIClient } = require("lisk-elements");
const db = require("./db");

const LiskClient = APIClient.createTestnetAPIClient();
const LiskTransaction = lisk.transaction;
const LiskUtils = lisk.transaction.utils;

