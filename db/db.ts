import * as SQLite from 'expo-sqlite';

interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  transfer?: {
    fromAccountId?: string;
    toAccountId?: string;
  };
}

const db = SQLite.openDatabaseSync('bloom_budget.db');

export const setupDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        type TEXT,
        categoryId TEXT,
        amount REAL,
        accountId TEXT,
        date TEXT,
        notes TEXT,
        transferFrom TEXT,
        transferTo TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        balance REAL,
        icon TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        categoryId TEXT,
        budgetLimit REAL,
        startDate TEXT,
        endDate TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        amount REAL,
        categoryId TEXT,
        status TEXT,
        renewalDate TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0
      );
    `);
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

export const addTransaction = async (transaction: Transaction) => {
  try {
    await db.runAsync(
      `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, transferFrom, transferTo, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id, transaction.userId, transaction.type,
        transaction.categoryId, transaction.amount, transaction.accountId,
        transaction.date, transaction.notes || "", transaction.transfer?.fromAccountId || null,
        transaction.transfer?.toAccountId || null, 0
      ]
    );
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const getUnsyncedData = async (table: string) => {
  try {
    const result = await db.getAllAsync(`SELECT * FROM ${table} WHERE synced = 0;`);
    return result;
  } catch (error) {
    console.error(`Error getting unsynced data from ${table}:`, error);
    throw error;
  }
};

export const markAsSynced = async (table: string, id: string) => {
  try {
    await db.runAsync(
      `UPDATE ${table} SET synced = 1 WHERE id = ?;`,
      [id]
    );
  } catch (error) {
    console.error(`Error marking ${table} as synced:`, error);
    throw error;
  }
};

export default db;
