import mysql from 'mysql2/promise';

const connectionParams = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'payout'
};

export const getMysqlConnection = async():Promise<mysql.Connection|undefined> => {
  try {
    const connection = await mysql.createConnection(connectionParams);
    await connection.connect();
    console.info(`mysql connect: success`);
    return connection;
  } catch(err) {
    console.error(`mysql connect: fialed`);
    console.error(err);
    return undefined;
  }
}