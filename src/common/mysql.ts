import mysql from 'mysql2/promise';
import { convertLSKToBeddows } from '@liskhq/lisk-transactions'
import { REWARD, VOTER, MANAGE } from './type';
import { NETWORK, DELEGATE, DB_PARAMS } from './config';

export const getMysqlConnection = async (): Promise<mysql.Connection | undefined> => {
  try {
    const connection = await mysql.createConnection(DB_PARAMS);
    await connection.connect();
    return connection;

  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export const findReward = async (connection: mysql.Connection): Promise<mysql.RowDataPacket | undefined> => {
  const query: string = "SELECT * FROM `reward` WHERE `id` = ?";
  const params: any[] = [NETWORK];
  const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export const updReward = async (connection: mysql.Connection, isUpdate: boolean, data: REWARD) => {
  let query: string = isUpdate ? "UPDATE `reward` SET ? WHERE `id` = ?" : "INSERT INTO `reward` SET ?";
  let params: any[] = isUpdate ? [data, NETWORK] : [data];
  await connection.query(query, params);
}

export const findVoter = async (connection: mysql.Connection, address: string): Promise<mysql.RowDataPacket | undefined> => {
  const query: string = "SELECT * FROM `voter` WHERE `id` = ? AND `address` = ?";
  const params: any[] = [NETWORK, address];
  const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export const findVoters = async (connection: mysql.Connection): Promise<mysql.RowDataPacket[] | undefined> => {
  const query: string = "SELECT * FROM `voter` WHERE `id` = ?";
  const params: any[] = [NETWORK];
  const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, params);
  return rows.length > 0 ? rows : undefined;
}

export const findRewardTargetVoters = async (connection: mysql.Connection): Promise<mysql.RowDataPacket[] | undefined> => {
  const query: string = "SELECT * FROM `voter` WHERE `id` = ? AND CAST(`reward` AS UNSIGNED) >= ?";
  const params: any[] = [NETWORK, BigInt(convertLSKToBeddows(DELEGATE.MINIMUMPAY.VOTER.toString()))];
  const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, params);
  return rows.length > 0 ? rows : undefined;
}

export const updVoter = async (connection: mysql.Connection, isUpdate: boolean, data: VOTER) => {
  let query: string = isUpdate ? "UPDATE `voter` SET ? WHERE `id` = ? AND `address` = ?" : "INSERT INTO `voter` SET ?";
  let params: any[] = isUpdate ? [data, NETWORK, data.address] : [data];
  await connection.query(query, params);
}

export const findManage = async (connection: mysql.Connection): Promise<mysql.RowDataPacket | undefined> => {
  const query: string = "SELECT * FROM `manage` WHERE `id` = ?";
  const params: any[] = [NETWORK];
  const [rows]: [mysql.RowDataPacket[], mysql.FieldPacket[]] = await connection.query(query, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export const updManage = async (connection: mysql.Connection, isUpdate: boolean, manageData: MANAGE) => {
  let query: string = isUpdate ? "UPDATE `manage` SET ? WHERE `id` = ?" : "INSERT INTO `manage` SET ?";
  let params: any[] = isUpdate ? [manageData, NETWORK] : [manageData];
  await connection.query(query, params);
}