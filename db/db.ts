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

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        type TEXT,
        icon TEXT,
        color TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0
      );
    `);

    // Insert default categories and accounts if they don't exist
    await insertDefaultData();
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

const insertDefaultData = async () => {
  try {
    // Insert default accounts
    await db.runAsync(`
      INSERT OR IGNORE INTO accounts (id, userId, name, balance, icon, createdAt, updatedAt)
      VALUES 
        ('cash_1', 'default_user', 'Cash', 0, 'cash', datetime('now'), datetime('now')),
        ('bank_1', 'default_user', 'Bank Account', 0, 'bank', datetime('now'), datetime('now'));
    `);

    // Insert default categories
    await db.runAsync(`
      INSERT OR IGNORE INTO categories (id, userId, name, type, icon, color, createdAt)
      VALUES 
        ('food_1', 'default_user', 'Food & Dining', 'expense', 'food', '#FF6B6B', datetime('now')),
        ('transport_1', 'default_user', 'Transportation', 'expense', 'car', '#4ECDC4', datetime('now')),
        ('shopping_1', 'default_user', 'Shopping', 'expense', 'shopping', '#45B7D1', datetime('now')),
        ('bills_1', 'default_user', 'Bills & Utilities', 'expense', 'bill', '#96CEB4', datetime('now')),
        ('salary_1', 'default_user', 'Salary', 'income', 'money', '#2ECC71', datetime('now')),
        ('freelance_1', 'default_user', 'Freelance', 'income', 'laptop', '#3498DB', datetime('now')),
        ('transfer_1', 'default_user', 'Transfer', 'transfer', 'transfer', '#9B59B6', datetime('now'));
    `);
  } catch (error) {
    console.error('Error inserting default data:', error);
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
