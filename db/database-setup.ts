// database-setup.ts
import { db, INIT_TABLE_NAME } from './database-core';

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
        avatar TEXT,
        dateOfBirth TEXT,
        occupation TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_interests (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        interest TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        type TEXT,
        icon TEXT,
        color TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subcategories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        type TEXT,
        color TEXT,
        parentCategoryId TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (parentCategoryId) REFERENCES categories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        type TEXT,
        categoryId TEXT,
        subCategoryId TEXT,
        amount REAL,
        accountId TEXT,
        date TEXT,
        notes TEXT,
        linkedTransactionId TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL,
        FOREIGN KEY (subCategoryId) REFERENCES subcategories (id) ON DELETE SET NULL,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (linkedTransactionId) REFERENCES transactions (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        balance REAL,
        icon TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        categoryId TEXT,
        budgetLimit REAL,
        month INTEGER,
        year INTEGER,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
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
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL
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
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
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
export const migrateDatabase = async () => {
  try {
    // Check if we need to add new columns to the users table
    const userColumns = await db.getAllAsync("PRAGMA table_info(users);");
    
    const avatarExists = userColumns.some((column: any) => column.name === 'avatar');
    const dateOfBirthExists = userColumns.some((column: any) => column.name === 'dateOfBirth');
    const occupationExists = userColumns.some((column: any) => column.name === 'occupation');
    
    // Add the new columns if they don't exist
    if (!avatarExists) {
      console.log('Adding avatar column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN avatar TEXT;");
    }
    
    if (!dateOfBirthExists) {
      console.log('Adding dateOfBirth column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN dateOfBirth TEXT;");
    }
    
    if (!occupationExists) {
      console.log('Adding occupation column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN occupation TEXT;");
    }
    
    // Check if user_interests table exists
    const tablesResult = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tablesResult.map((t: any) => t.name);
    
    if (!tableNames.includes('user_interests')) {
      console.log('Creating user_interests table');
      await db.execAsync(`
        CREATE TABLE user_interests (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          interest TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        );
      `);
    }
    
    // Check if subcategories table exists
    if (!tableNames.includes('subcategories')) {
      console.log('Creating subcategories table');
      await db.execAsync(`
        CREATE TABLE subcategories (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          name TEXT,
          type TEXT,
          color TEXT,
          parentCategoryId TEXT,
          createdAt TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (parentCategoryId) REFERENCES categories (id) ON DELETE CASCADE
        );
      `);
    }
    
    // Check if transactions table has the subCategoryId column
    const transactionColumns = await db.getAllAsync("PRAGMA table_info(transactions);");
    const subCategoryIdExists = transactionColumns.some((column: any) => column.name === 'subCategoryId');
    
    if (!subCategoryIdExists) {
      console.log('Adding subCategoryId column to transactions table');
      await db.execAsync("ALTER TABLE transactions ADD COLUMN subCategoryId TEXT REFERENCES subcategories(id);");
    }

    // Check if budgetLimit column exists in budgets table
    const budgetColumns = await db.getAllAsync("PRAGMA table_info(budgets);");
    
    const budgetLimitExists = budgetColumns.some(
      (column: any) => column.name === 'budgetLimit'
    );
    
    // Add budgetLimit column if it doesn't exist
    if (!budgetLimitExists) {
      console.log('Adding budgetLimit column to budgets table');
      await db.execAsync(
        "ALTER TABLE budgets ADD COLUMN budgetLimit REAL DEFAULT 0;"
      );
    }
    
    // Check if we need to migrate the transactions table for linked transactions
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
                id, userId, type, categoryId, subCategoryId, amount, accountId, date, notes, linkedTransactionId, synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              creditTransactionId,
              transaction.userId,
              'credit',
              transaction.categoryId,
              null, // subCategoryId
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
  } catch (error) {
    console.error('Error migrating database:', error);
    throw error;
  }
};

export const insertDefaultData = async (userId: string) => {
  try {
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
    `, [userId, userId, userId, userId, userId, userId]);
    
    // Insert default subcategories
    await db.runAsync(`
      INSERT OR IGNORE INTO subcategories (id, userId, name, type, color, parentCategoryId, createdAt)
      VALUES 
        ('grocery_1', ?, 'Groceries', 'expense', '#FF6B6B', 'food_1', datetime('now')),
        ('restaurant_1', ?, 'Restaurants', 'expense', '#FF6B6B', 'food_1', datetime('now')),
        ('gas_1', ?, 'Gas', 'expense', '#4ECDC4', 'transport_1', datetime('now')),
        ('clothing_1', ?, 'Clothing', 'expense', '#45B7D1', 'shopping_1', datetime('now')),
        ('electronics_1', ?, 'Electronics', 'expense', '#45B7D1', 'shopping_1', datetime('now'));
    `, [userId, userId, userId, userId, userId]);
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};