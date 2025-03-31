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

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

const db = SQLite.openDatabaseSync('bloom_budget.db');

// Add a table to track initialization status
const INIT_TABLE_NAME = 'app_initialization';

export const setupDatabase = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${INIT_TABLE_NAME} (
        initialized INTEGER DEFAULT 0
      );

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

    // Check if initialization has already been done
    const result = await db.getFirstAsync<{ initialized: number }>(
      `SELECT initialized FROM ${INIT_TABLE_NAME} LIMIT 1;`
    );

    if (!result || result.initialized === 0) {
      // Insert default categories and accounts
      await insertDefaultData();
      
      // Mark initialization as complete
      await db.runAsync(
        `INSERT INTO ${INIT_TABLE_NAME} (initialized) VALUES (1);`
      );
    }
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

// Function to get all data from a table
const getAllDataFromTable = async <T>(table: string): Promise<T[]> => {
  try {
    const result = await db.getAllAsync<T>(`SELECT * FROM ${table}`);
    return result;
  } catch (error) {
    console.error(`Error getting all data from ${table}:`, error);
    throw error;
  }
};

// Add a new account
export const addAccount = async (account: Account) => {
  try {
    await db.runAsync(
      `INSERT INTO accounts (id, userId, name, balance, icon, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.userId,
        account.name,
        account.balance,
        account.icon,
        account.createdAt,
        account.updatedAt,
        0
      ]
    );
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

// Get all accounts for a user
export const getAccounts = async (userId: string) => {
  try {
    const accounts = await db.getAllAsync<Account>(
      `SELECT * FROM accounts WHERE userId = ?`,
      [userId]
    );
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
};

// Get a single account by ID
export const getAccountById = async (accountId: string) => {
  try {
    const account = await db.getFirstAsync<Account>(
      `SELECT * FROM accounts WHERE id = ?`,
      [accountId]
    );
    return account;
  } catch (error) {
    console.error('Error getting account:', error);
    throw error;
  }
};

// Update an account
export const updateAccount = async (account: Account) => {
  try {
    await db.runAsync(
      `UPDATE accounts 
       SET name = ?, balance = ?, icon = ?, updatedAt = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        account.name,
        account.balance,
        account.icon,
        new Date().toISOString(),
        account.id,
        account.userId
      ]
    );
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// Delete an account
export const deleteAccount = async (accountId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM accounts WHERE id = ? AND userId = ?`,
      [accountId, userId]
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Export functions to get all data from each table
export const getAllTransactions = async (): Promise<Transaction[]> => getAllDataFromTable<Transaction>('transactions');
export const getAllAccounts = async (): Promise<Account[]> => getAllDataFromTable<Account>('accounts');
export const getAllBudgets = async (): Promise<Budget[]> => getAllDataFromTable<Budget>('budgets');
export const getAllSubscriptions = async (): Promise<Subscription[]> => getAllDataFromTable<Subscription>('subscriptions');
export const getAllCategories = async (): Promise<Category[]> => getAllDataFromTable<Category>('categories');

export default db;
