# lisk-payout
payout script

## note
This package requires MongoDB.

#### MongoDB setting example

```
DB:
  lisk-payout

Collection:
  forged
    { current: String, past: String }
  accounts
    { publicKey: String, pending: String, latestPayoutDate: Date }

User:
  db.createUser({
    user:"payout",
    pwd:"payout",
    roles:[{ role:"readWrite", db:"lisk-payout" }]
  })
```

## setup
```
cd src
npm i
npm i -g pm2
```

## run

#### batch
```
cd src/cron
pm2 start cron_update.js --name lp-update
pm2 start cron_payout.js --name lp-payout
```

#### api
```
cd src
pm2 start index.js --name lp-api
```

