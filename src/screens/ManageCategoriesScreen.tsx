import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import db from '../../db/db';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
}

// Function to check if a string is a single emoji
const isSingleEmoji = (str: string): boolean => {
  // This regex will match any emoji, including compound emojis
  const emojiRegex = /^[\p{Emoji}]$/u;
  return emojiRegex.test(str);
};

// Function to check if a string contains only text and numbers
const isTextAndNumbersOnly = (str: string): boolean => {
  return /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(str);
};

export default function ManageCategoriesScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '',
    color: '#FF6B6B',
  });

  const loadCategories = useCallback(async () => {
    try {
      const result = await db.getAllAsync<Category>(
        `SELECT * FROM categories WHERE userId = ? ORDER BY id`,
        [userId]
      );
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  }, [userId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleNameChange = (text: string) => {
    if (isTextAndNumbersOnly(text)) {
      setFormData(prev => ({ ...prev, name: text }));
    }
  };

  const handleIconChange = (text: string) => {
    // Allow empty values
    if (!text) {
      setFormData(prev => ({ ...prev, icon: '' }));
      return;
    }
    
    // Take the first emoji from the input
    const firstChar = [...text][0];
    setFormData(prev => ({ ...prev, icon: firstChar }));
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (!formData.icon.trim()) {
      Alert.alert('Error', 'Please enter an emoji icon');
      return;
    }

    try {
      const id = `cat_${Date.now()}`;
      await db.runAsync(
        `INSERT INTO categories (id, userId, name, type, icon, color, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, userId, formData.name, formData.type, formData.icon, formData.color]
      );
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      await db.runAsync(
        `UPDATE categories 
         SET name = ?, type = ?, icon = ?, color = ?
         WHERE id = ?`,
        [formData.name, formData.type, formData.icon, formData.color, editingCategory.id]
      );
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
              await loadCategories();
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: '',
      color: '#FF6B6B',
    });
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
    });
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    resetForm();
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    resetForm();
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
    }`}>
      <View className="flex-row items-center flex-1">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: item.color }}
        >
          <Text className="text-2xl">{item.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className={`font-montserrat-medium text-lg ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            {item.name}
          </Text>
          <Text className={`font-montserrat text-sm ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          className="mr-4"
        >
          <Feather
            name="edit"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
          <Ionicons
            name="trash-outline"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <Text className={`text-2xl font-montserrat-bold mb-6 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Manage Categories
        </Text>

        <TouchableOpacity
          onPress={openAddModal}
          className={`p-4 rounded-xl mb-6 flex-row items-center justify-center ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text className="text-white font-montserrat-semibold ml-2">
            Add New Category
          </Text>
        </TouchableOpacity>

        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={closeModal}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              className="p-6"
            >
              <Text className={`text-xl font-montserrat-bold mb-6 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>

              <View className="flex-row items-center mb-6">
                <View 
                  className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: formData.color }}
                >
                  <TextInput
                    className="text-3xl text-center"
                    value={formData.icon}
                    onChangeText={handleIconChange}
                    placeholder="Add emoji"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    maxLength={2}
                    editable={true}
                    selectTextOnFocus={true}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`p-4 rounded-lg ${
                      isDarkMode 
                        ? 'bg-BackgroundDark text-TextPrimaryDark' 
                        : 'bg-white text-TextPrimary'
                    }`}
                    placeholder="Category Name"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    value={formData.name}
                    onChangeText={handleNameChange}
                  />
                </View>
              </View>

              <Text className={`font-montserrat-medium mb-3 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Type
              </Text>
              <View className="flex-row justify-between mb-6">
                {['expense', 'income', 'transfer'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                    className={`p-3 rounded-lg flex-1 mx-1 ${
                      formData.type === type
                        ? isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                        : isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                    }`}
                  >
                    <Text className={`font-montserrat-medium text-center ${
                      formData.type === type
                        ? 'text-white'
                        : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className={`font-montserrat-medium mb-3 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Color
              </Text>
              <View className="flex-row justify-between mb-6">
                {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#2ECC71', '#3498DB', '#9B59B6'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-full ${
                      formData.color === color
                        ? 'border-2 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </View>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  onPress={closeModal}
                  className={`p-4 rounded-lg flex-1 mr-2 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text className={`text-center font-montserrat-semibold ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingCategory ? handleEditCategory : handleAddCategory}
                  className={`p-4 rounded-lg flex-1 ml-2 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text className="text-white text-center font-montserrat-semibold">
                    {editingCategory ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
} 