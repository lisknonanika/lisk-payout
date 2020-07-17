const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const { APIClient, transactions, cryptography } = require("lisk-elements");
const { MongoClient } = require("mongodb");
const conf = require("./config.json");
const db = require("./db");

const client = conf.mainnet? APIClient.createMainnetAPIClient(): APIClient.createTestnetAPIClient();

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(helmet());

const router = express.Router();
app.use('/payout', router);

/**
 * get pending
 */
router.get('/', async (req, res) => {
    let con = null;
    try {
        con = await MongoClient.connect(db.config.url, db.config.auth);
        const address = req.query.address;
        if (!address) {
            res.json({result: false, error: "parameter: address is required!"});
            return;
        }

        try {
            transactions.utils.validateAddress(address);
        } catch (err) {
            res.json({result: true, pending: "0"});
            return;
        }
        const liskData = await client.accounts.get({address: address});
        if (!liskData.data) {
            res.json({result: true, pending: "0"});
            return;
        } 
        const publicKey = liskData.data[0].publicKey;
        const dbData = await db.getAccountByPublicKey(con, publicKey);
        const pending = dbData? transactions.utils.convertBeddowsToLSK(dbData.pending): "0";
        res.json({result: true, pending: pending});
    } catch (err) {
        console.log(err);
        res.json({result: false, error: "Something happened."});
    } finally {
        if (con && con.isConnected) await con.close();
    }
});

/**
 * get info
 */
router.get('/info', async (req, res) => {
    try {
        res.json({
            result: true,
            address: cryptography.getAddressFromPublicKey(conf.publicKey),
            minimum: conf.minimum,
            rate: conf.rate,
            connection: conf.mainnet? "mainnet": "testnet"
        });
    } catch(err) {
        console.log(err);
        res.json({result: false, error: "Something happened."});
    };
});

app.listen(conf.port || 3000);
console.log(`[lisk-payout] Start port=${conf.port || 3000}`);
