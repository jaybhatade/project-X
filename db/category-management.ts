// category-management.ts
import { db } from './database-core';
import { Category, Subcategory } from './types';

/**
 * Adds a new category to the database
 * @param category The category to add
 */
export const addCategory = async (category: Category) => {
  try {
    await db.runAsync(
      `INSERT INTO categories (id, userId, name, type, icon, color, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        category.id,
        category.userId,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.createdAt || new Date().toISOString()
      ]
    );
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

/**
 * Gets all categories for a specific user
 * @param userId The user ID
 * @returns An array of categories
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE userId = ?`,
      [userId]
    );
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

/**
 * Gets a category by its ID
 * @param categoryId The category ID
 * @returns The category or undefined if not found
 */
export const getCategoryById = async (categoryId: string): Promise<Category | undefined> => {
  try {
    const category = await db.getFirstAsync<Category>(
      `SELECT * FROM categories WHERE id = ?`,
      [categoryId]
    );
    return category;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    throw error;
  }
};

/**
 * Gets categories by type (income, expense, transfer)
 * @param type The category type
 * @param userId The user ID
 * @returns An array of categories of the specified type
 */
export const getCategoriesByType = async (type: string, userId: string): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE type = ? AND userId = ?`,
      [type, userId]
    );
    return categories;
  } catch (error) {
    console.error('Error getting categories by type:', error);
    throw error;
  }
};

/**
 * Updates an existing category
 * @param category The category with updated values
 */
export const updateCategory = async (category: Category) => {
  try {
    await db.runAsync(
      `UPDATE categories 
       SET name = ?, type = ?, icon = ?, color = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        category.name,
        category.type,
        category.icon,
        category.color,
        category.id,
        category.userId
      ]
    );
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Deletes a category
 * @param categoryId The ID of the category to delete
 * @param userId The user ID for verification
 */
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

/**
 * Gets all categories in the database
 * @returns An array of all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(`SELECT * FROM categories`);
    return categories;
  } catch (error) {
    console.error('Error getting all categories:', error);
    throw error;
  }
};

// Subcategory functions

/**
 * Adds a new subcategory to the database
 * @param subcategory The subcategory to add
 */
export const addSubcategory = async (subcategory: Subcategory) => {
  try {
    await db.runAsync(
      `INSERT INTO subcategories (id, userId, name, type, color, parentCategoryId, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        subcategory.id,
        subcategory.userId,
        subcategory.name,
        subcategory.type,
        subcategory.color,
        subcategory.parentCategoryId,
        subcategory.createdAt || new Date().toISOString()
      ]
    );
  } catch (error) {
    console.error('Error adding subcategory:', error);
    throw error;
  }
};

/**
 * Gets all subcategories for a specific user
 * @param userId The user ID
 * @returns An array of subcategories
 */
export const getSubcategories = async (userId: string): Promise<Subcategory[]> => {
  try {
    const subcategories = await db.getAllAsync<Subcategory>(
      `SELECT * FROM subcategories WHERE userId = ?`,
      [userId]
    );
    return subcategories;
  } catch (error) {
    console.error('Error getting subcategories:', error);
    throw error;
  }
};

/**
 * Gets subcategories belonging to a specific category
 * @param categoryId The parent category ID
 * @returns An array of subcategories
 */
export const getSubcategoriesByCategory = async (categoryId: string): Promise<Subcategory[]> => {
  try {
    const subcategories = await db.getAllAsync<Subcategory>(
      `SELECT * FROM subcategories WHERE parentCategoryId = ?`,
      [categoryId]
    );
    return subcategories;
  } catch (error) {
    console.error('Error getting subcategories by category:', error);
    throw error;
  }
};

/**
 * Gets a subcategory by its ID
 * @param subcategoryId The subcategory ID
 * @returns The subcategory or undefined if not found
 */
export const getSubcategoryById = async (subcategoryId: string): Promise<Subcategory | undefined> => {
  try {
    const subcategory = await db.getFirstAsync<Subcategory>(
      `SELECT * FROM subcategories WHERE id = ?`,
      [subcategoryId]
    );
    return subcategory;
  } catch (error) {
    console.error('Error getting subcategory by ID:', error);
    throw error;
  }
};

/**
 * Updates an existing subcategory
 * @param subcategory The subcategory with updated values
 */
export const updateSubcategory = async (subcategory: Subcategory) => {
  try {
    await db.runAsync(
      `UPDATE subcategories 
       SET name = ?, type = ?, color = ?, parentCategoryId = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        subcategory.name,
        subcategory.type,
        subcategory.color,
        subcategory.parentCategoryId,
        subcategory.id,
        subcategory.userId
      ]
    );
  } catch (error) {
    console.error('Error updating subcategory:', error);
    throw error;
  }
};

/**
 * Deletes a subcategory
 * @param subcategoryId The ID of the subcategory to delete
 * @param userId The user ID for verification
 */
export const deleteSubcategory = async (subcategoryId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM subcategories WHERE id = ? AND userId = ?`,
      [subcategoryId, userId]
    );
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    throw error;
  }
};

/**
 * Gets all subcategories in the database
 * @returns An array of all subcategories
 */
export const getAllSubcategories = async (): Promise<Subcategory[]> => {
  try {
    const subcategories = await db.getAllAsync<Subcategory>(`SELECT * FROM subcategories`);
    return subcategories;
  } catch (error) {
    console.error('Error getting all subcategories:', error);
    throw error;
  }
};

/**
 * Gets categories with their subcategories for a user
 * @param userId The user ID
 * @returns An array of categories with their subcategories
 */
export const getCategoriesWithSubcategories = async (userId: string): Promise<Array<Category & { subcategories: Subcategory[] }>> => {
  try {
    const categories = await getCategories(userId);
    
    const result = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await getSubcategoriesByCategory(category.id);
        return {
          ...category,
          subcategories
        };
      })
    );
    
    return result;
  } catch (error) {
    console.error('Error getting categories with subcategories:', error);
    throw error;
  }
};

/**
 * Moves all transactions from one category to another
 * @param fromCategoryId The source category ID
 * @param toCategoryId The destination category ID
 * @param userId The user ID for verification
 * @returns The number of transactions updated
 */
export const moveTransactionsBetweenCategories = async (
  fromCategoryId: string,
  toCategoryId: string,
  userId: string
): Promise<number> => {
  try {
    const result = await db.runAsync(
      `UPDATE transactions 
       SET categoryId = ?, synced = 0
       WHERE categoryId = ? AND userId = ?`,
      [toCategoryId, fromCategoryId, userId]
    );
    
    return result.changes;
  } catch (error) {
    console.error('Error moving transactions between categories:', error);
    throw error;
  }
};