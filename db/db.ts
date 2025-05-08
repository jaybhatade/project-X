import * as SQLite from 'expo-sqlite';

// Add User interface
interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  synced: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  linkedTransactionId?: string;
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

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  month: number; // 0-11 for January-December
  year: number;
  createdAt: string;
  synced: number;
}

interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  status: string;
  renewalDate: string;
  createdAt: string;
  synced: number;
}

interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  createdAt: string;
  synced: number;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  emoji: string;
  targetAmount: number;
  targetDate: string;
  accountId: string;
  includeBalance: boolean;
  monthlyContribution: number;
  createdAt: string;
  synced: number;
}

const db = SQLite.openDatabaseSync('bloom_budget.db');

// Add a table to track initialization status
const INIT_TABLE_NAME = 'app_initialization';

export const setupDatabase = async (userId: string) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${INIT_TABLE_NAME} (
        initialized INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        firstName TEXT,
        lastName TEXT,
        phoneNumber TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0
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
        linkedTransactionId TEXT,
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
        month INTEGER,
        year INTEGER,
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

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        title TEXT,
        emoji TEXT,
        targetAmount REAL,
        targetDate TEXT,
        accountId TEXT,
        includeBalance INTEGER,
        monthlyContribution REAL,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
      );
    `);

    // Ensure all database schema migrations are applied
    await migrateDatabase();

    // Check if initialization has already been done
    const result = await db.getFirstAsync<{ initialized: number }>(
      `SELECT initialized FROM ${INIT_TABLE_NAME} LIMIT 1;`
    );

    if (!result || result.initialized === 0) {
      // Insert default categories and accounts
      await insertDefaultData(userId);
      
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

// Function to handle database migrations
const migrateDatabase = async () => {
  try {
    // Check if budgetLimit column exists in budgets table
    const tableInfo = await db.getAllAsync(
      "PRAGMA table_info(budgets);"
    );
    
    const budgetLimitExists = tableInfo.some(
      (column: any) => column.name === 'budgetLimit'
    );
    
    // Add budgetLimit column if it doesn't exist
    if (!budgetLimitExists) {
      console.log('Adding budgetLimit column to budgets table');
      await db.execAsync(
        "ALTER TABLE budgets ADD COLUMN budgetLimit REAL DEFAULT 0;"
      );
    }
    
    // Check if we need to migrate the transactions table
    const transactionColumns = await db.getAllAsync(
      "PRAGMA table_info(transactions);"
    );
    
    const linkedTransactionIdExists = transactionColumns.some(
      (column: any) => column.name === 'linkedTransactionId'
    );
    
    const transferFromExists = transactionColumns.some(
      (column: any) => column.name === 'transferFrom'
    );
    
    const transferToExists = transactionColumns.some(
      (column: any) => column.name === 'transferTo'
    );
    
    // Add linkedTransactionId if it doesn't exist
    if (!linkedTransactionIdExists) {
      console.log('Adding linkedTransactionId column to transactions table');
      await db.execAsync(
        "ALTER TABLE transactions ADD COLUMN linkedTransactionId TEXT;"
      );
      
      // If the old columns exist, migrate data from them
      if (transferFromExists && transferToExists) {
        console.log('Migrating transfer transactions data');
        
        // Get all transfer transactions
        const transferTransactions = await db.getAllAsync(`
          SELECT * FROM transactions
          WHERE type = 'transfer' AND (transferFrom IS NOT NULL OR transferTo IS NOT NULL)
        `);
        
        // For each transfer transaction, create a linked transaction with type credit
        for (const transaction of transferTransactions) {
          if (transaction.transferFrom && transaction.transferTo) {
            // Create a new transaction for the "to" account
            const creditTransactionId = `trans_credit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            // Insert credit transaction
            await db.runAsync(`
              INSERT INTO transactions (
                id, userId, type, categoryId, amount, accountId, date, notes, linkedTransactionId, synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              creditTransactionId,
              transaction.userId,
              'credit',
              transaction.categoryId,
              transaction.amount,
              transaction.transferTo,
              transaction.date,
              transaction.notes || '',
              transaction.id
            ]);
            
            // Update original transaction to be a debit transaction and link it to the credit transaction
            await db.runAsync(`
              UPDATE transactions 
              SET type = 'debit', linkedTransactionId = ?
              WHERE id = ?
            `, [creditTransactionId, transaction.id]);
          }
        }
      }
    }
    
    // Remove old columns if they exist but only after migration
    if (transferFromExists || transferToExists) {
      // In SQLite, we need to recreate the table to remove columns
      // This is a simplified approach - in a production app you might handle this differently
      console.log('Cleaning up old transfer columns');
      
      // We'll only do this if we've successfully migrated the data
      if (linkedTransactionIdExists) {
        // We don't actually remove the columns as SQLite doesn't support DROP COLUMN
        // Instead, we'll just stop using them
        console.log('Transfer columns will be ignored going forward');
      }
    }
  } catch (error) {
    console.error('Error migrating database:', error);
    throw error;
  }
};

const insertDefaultData = async (userId: string) => {
  try {
    // Note: Initial accounts are now created via the InitialBalanceModal component
    // instead of being automatically added here.

    // Insert default categories
    await db.runAsync(`
      INSERT OR IGNORE INTO categories (id, userId, name, type, icon, color, createdAt)
      VALUES 
        ('food_1', ?, 'Food & Dining', 'expense', '🍞', '#FF6B6B', datetime('now')),
        ('transport_1', ?, 'Transportation', 'expense', '🚗', '#4ECDC4', datetime('now')),
        ('shopping_1', ?, 'Shopping', 'expense', '🛒', '#45B7D1', datetime('now')),
        ('salary_1', ?, 'Salary', 'income', '💰', '#2ECC71', datetime('now')),
        ('freelance_1', ?, 'Freelance', 'income', '💻', '#3498DB', datetime('now')),
        ('transfer_1', ?, 'Transfer', 'transfer', '↔️', '#9B59B6', datetime('now'));
    `, [userId, userId, userId, userId, userId, userId, userId]);
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};


export const addTransaction = async (transaction: Transaction) => {
  try {
    await db.runAsync(
      `INSERT INTO transactions (id, userId, type, categoryId, amount, accountId, date, notes, linkedTransactionId, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.categoryId,
        transaction.amount,
        transaction.accountId,
        transaction.date,
        transaction.notes || "",
        transaction.linkedTransactionId || null
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
export const getAllGoals = async (): Promise<Goal[]> => getAllDataFromTable<Goal>('goals');

export const deleteTransaction = async (transactionId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM transactions WHERE id = ?`,
      [transactionId]
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const deleteSubscription = async (subscriptionId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM subscriptions WHERE id = ? AND userId = ?`,
      [subscriptionId, userId]
    );
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM categories WHERE id = ? AND userId = ?`,
      [categoryId, userId]
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Budget-specific functions
export const addBudget = async (budget: Budget) => {
  try {
    await db.runAsync(
      `INSERT INTO budgets (id, userId, categoryId, budgetLimit, month, year, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        budget.id,
        budget.userId,
        budget.categoryId,
        budget.budgetLimit,
        budget.month,
        budget.year,
        budget.createdAt,
        0
      ]
    );
  } catch (error) {
    console.error('Error adding budget:', error);
    throw error;
  }
};

export const updateBudget = async (budget: Budget) => {
  try {
    await db.runAsync(
      `UPDATE budgets 
       SET categoryId = ?, budgetLimit = ?, month = ?, year = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        budget.categoryId,
        budget.budgetLimit,
        budget.month,
        budget.year,
        budget.id,
        budget.userId
      ]
    );
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (budgetId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM budgets WHERE id = ? AND userId = ?`,
      [budgetId, userId]
    );
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

export const getBudgetsByUserId = async (userId: string) => {
  try {
    const budgets = await db.getAllAsync<Budget>(
      `SELECT * FROM budgets WHERE userId = ?`,
      [userId]
    );
    return budgets;
  } catch (error) {
    console.error('Error getting budgets:', error);
    throw error;
  }
};

export const getBudgetById = async (budgetId: string) => {
  try {
    const budget = await db.getFirstAsync<Budget>(
      `SELECT * FROM budgets WHERE id = ?`,
      [budgetId]
    );
    return budget;
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
};

export const getBudgetSpending = async (categoryId: string, month: number, year: number) => {
  try {
    // Calculate the first and last day of the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const result = await db.getFirstAsync<{ totalSpent: number }>(
      `SELECT SUM(amount) as totalSpent FROM transactions 
       WHERE categoryId = ? AND date BETWEEN ? AND ? AND type = 'expense'`,
      [categoryId, startDate, endDate]
    );
    return result?.totalSpent || 0;
  } catch (error) {
    console.error('Error calculating budget spending:', error);
    throw error;
  }
};

export const getBudgetsWithSpending = async (userId: string) => {
  try {
    const budgets = await getBudgetsByUserId(userId);
    
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await getBudgetSpending(
          budget.categoryId, 
          budget.month, 
          budget.year
        );
        
        return {
          ...budget,
          spent,
          remaining: budget.budgetLimit - spent,
          percentUsed: (spent / budget.budgetLimit) * 100
        };
      })
    );
    
    return budgetsWithSpending;
  } catch (error) {
    console.error('Error getting budgets with spending:', error);
    throw error;
  }
};

// Goal-specific functions
export const addGoal = async (goal: Goal) => {
  try {
    await db.runAsync(
      `INSERT INTO goals (id, userId, title, emoji, targetAmount, targetDate, accountId, includeBalance, monthlyContribution, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.userId,
        goal.title,
        goal.emoji,
        goal.targetAmount,
        goal.targetDate,
        goal.accountId,
        goal.includeBalance ? 1 : 0,
        goal.monthlyContribution,
        goal.createdAt || new Date().toISOString(),
        0
      ]
    );
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goal: Goal) => {
  try {
    await db.runAsync(
      `UPDATE goals 
       SET title = ?, emoji = ?, targetAmount = ?, targetDate = ?, accountId = ?, includeBalance = ?, monthlyContribution = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        goal.title,
        goal.emoji,
        goal.targetAmount,
        goal.targetDate,
        goal.accountId,
        goal.includeBalance ? 1 : 0,
        goal.monthlyContribution,
        goal.id,
        goal.userId
      ]
    );
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM goals WHERE id = ? AND userId = ?`,
      [goalId, userId]
    );
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

export const getGoalsByUserId = async (userId: string) => {
  try {
    const goals = await db.getAllAsync<Goal>(
      `SELECT * FROM goals WHERE userId = ?`,
      [userId]
    );
    return goals;
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

export const getGoalById = async (goalId: string) => {
  try {
    const goal = await db.getFirstAsync<Goal>(
      `SELECT * FROM goals WHERE id = ?`,
      [goalId]
    );
    return goal;
  } catch (error) {
    console.error('Error getting goal:', error);
    throw error;
  }
};

// User-specific functions
export const addUser = async (user: User) => {
  try {
    await db.runAsync(
      `INSERT INTO users (id, userId, firstName, lastName, phoneNumber, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.userId,
        user.firstName,
        user.lastName,
        user.phoneNumber,
        user.createdAt,
        user.updatedAt,
        0
      ]
    );
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const getUserByUserId = async (userId: string) => {
  try {
    const user = await db.getFirstAsync<User>(
      `SELECT * FROM users WHERE userId = ?`,
      [userId]
    );
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUser = async (user: User) => {
  try {
    await db.runAsync(
      `UPDATE users 
       SET firstName = ?, lastName = ?, phoneNumber = ?, updatedAt = ?, synced = 0
       WHERE userId = ?`,
      [
        user.firstName,
        user.lastName,
        user.phoneNumber,
        new Date().toISOString(),
        user.userId
      ]
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => getAllDataFromTable<User>('users');

export const clearDatabase = async () => {
  try {
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM accounts;
      DELETE FROM budgets;
      DELETE FROM subscriptions;
      DELETE FROM categories;
      DELETE FROM goals;
      DELETE FROM users;
      DELETE FROM ${INIT_TABLE_NAME};
    `);
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

export default db;
