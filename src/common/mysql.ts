import mysql from 'mysql2/promise';
import { NETWORK, REWARD, VOTER, MANAGE } from '../common/constats';

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

export const findReward = async(connection:mysql.Connection):Promise<mysql.RowDataPacket|undefined> => {
  const [rows]:[mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query('SELECT * FROM `reward` WHERE `id` = ?', [NETWORK]);
  return rows.length > 0? rows[0]: undefined;
}

export const updReward = async(connection:mysql.Connection, isUpdate:boolean, data:REWARD) => {
  if (isUpdate) {
    await connection.query('UPDATE `reward` SET ? WHERE `id` = ?', [data, NETWORK]);
  } else {
    await connection.query('INSERT INTO `reward` SET ?', data);
  }
}

export const findVoter = async(connection:mysql.Connection, address:string):Promise<mysql.RowDataPacket|undefined> => {
  const [rows]:[mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query('SELECT * FROM `voter` WHERE `id` = ? AND `address` = ?', [NETWORK, address]);
  return rows.length > 0? rows[0]: undefined;
}

export const updVoter = async(connection:mysql.Connection, isUpdate:boolean, data:VOTER) => {
  if (isUpdate) {
    await connection.query('UPDATE `voter` SET ? WHERE `id` = ? AND `address` = ?', [data, NETWORK, data.address]);
  } else {
    await connection.query('INSERT INTO `voter` SET ?', data);
  }
}

export const findManage = async(connection:mysql.Connection):Promise<mysql.RowDataPacket|undefined> => {
  const [rows]:[mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query('SELECT * FROM `manage` WHERE `id` = ?', [NETWORK]);
  return rows.length > 0? rows[0]: undefined;
}

export const updManage = async(connection:mysql.Connection, isUpdate:boolean, manageData:MANAGE) => {
  if (isUpdate) {
    await connection.query('UPDATE `manage` SET ? WHERE `id` = ?', [manageData, NETWORK]);
  } else {
    await connection.query('INSERT INTO `manage` SET ?', manageData);
  }
}