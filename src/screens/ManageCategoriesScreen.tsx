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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as CategoryManager from '../../db/category-management';
import { 
  Plus, 
  Trash, 
  Edit, 
  FolderOpen, 
  ChevronDown, 
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react-native'; // Using Lucide React Native icons

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  type: string;
  color: string;
  parentCategoryId: string;
  userId: string;
  createdAt?: string;
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
  const [categories, setCategories] = useState<Array<Category & { subcategories: Subcategory[] }>>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubcategoryModalVisible, setIsSubcategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [parentCategoryForSubcategory, setParentCategoryForSubcategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '',
    color: '#FF6B6B',
  });
  
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    color: '#FF6B6B',
  });

  const loadCategories = useCallback(async () => {
    try {
      const result = await CategoryManager.getCategoriesWithSubcategories(userId);
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

  const handleSubcategoryNameChange = (text: string) => {
    if (isTextAndNumbersOnly(text)) {
      setSubcategoryFormData(prev => ({ ...prev, name: text }));
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
      const newCategory: Category = {
        id,
        userId,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        createdAt: new Date().toISOString()
      };
      
      await CategoryManager.addCategory(newCategory);
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
      const updatedCategory = {
        ...editingCategory,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: formData.color
      };
      
      await CategoryManager.updateCategory(updatedCategory);
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleAddSubcategory = async () => {
    if (!subcategoryFormData.name.trim()) {
      Alert.alert('Error', 'Please enter a subcategory name');
      return;
    }
    if (!parentCategoryForSubcategory) {
      Alert.alert('Error', 'Parent category is required');
      return;
    }

    try {
      const id = `subcat_${Date.now()}`;
      const newSubcategory: Subcategory = {
        id,
        userId,
        name: subcategoryFormData.name,
        type: parentCategoryForSubcategory.type,
        color: subcategoryFormData.color,
        parentCategoryId: parentCategoryForSubcategory.id,
        createdAt: new Date().toISOString()
      };
      
      await CategoryManager.addSubcategory(newSubcategory);
      await loadCategories();
      closeSubcategoryModal();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      Alert.alert('Error', 'Failed to add subcategory');
    }
  };

  const handleEditSubcategory = async () => {
    if (!editingSubcategory || !parentCategoryForSubcategory) return;

    try {
      const updatedSubcategory = {
        ...editingSubcategory,
        name: subcategoryFormData.name,
        color: subcategoryFormData.color,
        parentCategoryId: parentCategoryForSubcategory.id,
        type: parentCategoryForSubcategory.type
      };
      
      await CategoryManager.updateSubcategory(updatedSubcategory);
      await loadCategories();
      closeSubcategoryModal();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      Alert.alert('Error', 'Failed to update subcategory');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? All related subcategories will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryManager.deleteCategory(id, userId);
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

  const handleDeleteSubcategory = async (id: string) => {
    Alert.alert(
      'Delete Subcategory',
      'Are you sure you want to delete this subcategory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryManager.deleteSubcategory(id, userId);
              await loadCategories();
            } catch (error) {
              console.error('Error deleting subcategory:', error);
              Alert.alert('Error', 'Failed to delete subcategory');
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

  const resetSubcategoryForm = () => {
    setSubcategoryFormData({
      name: '',
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

  const openAddSubcategoryModal = (parentCategory: Category) => {
    setEditingSubcategory(null);
    setParentCategoryForSubcategory(parentCategory);
    resetSubcategoryForm();
    setIsSubcategoryModalVisible(true);
  };

  const openEditSubcategoryModal = (subcategory: Subcategory, parentCategory: Category) => {
    setEditingSubcategory(subcategory);
    setParentCategoryForSubcategory(parentCategory);
    setSubcategoryFormData({
      name: subcategory.name,
      color: subcategory.color,
    });
    setIsSubcategoryModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    resetForm();
  };

  const closeSubcategoryModal = () => {
    setIsSubcategoryModalVisible(false);
    setEditingSubcategory(null);
    setParentCategoryForSubcategory(null);
    resetSubcategoryForm();
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderSubcategoryItem = ({ item, parentCategory }: { item: Subcategory, parentCategory: Category }) => (
    <View className={`p-4 pl-12 rounded-[20px] mb-2 flex-row items-center justify-between ${
      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
    }`}>
      <View className="flex-row items-center flex-1">
        <View 
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: item.color }}
        />
        <View className="flex-1">
          <Text className={`font-montserrat-medium text-base ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            {item.name}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => openEditSubcategoryModal(item, parentCategory)}
          className="mr-4"
        >
          <Edit
            size={22}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteSubcategory(item.id)}>
          <Trash
            size={22}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Category & { subcategories: Subcategory[] } }) => {
    const isExpanded = expandedCategories.includes(item.id);
    const hasSubcategories = item.subcategories && item.subcategories.length > 0;
    
    return (
      <View className="mb-3">
        <View className={`p-4 rounded-[20px] mb-2 flex-row items-center justify-between ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}>
          <TouchableOpacity 
            className="flex-row items-center flex-1"
            onPress={() => hasSubcategories && toggleCategoryExpansion(item.id)}
          >
            <View 
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ borderColor: item.color, borderWidth: 2 }}
            >
              <Text className="text-2xl">{item.icon}</Text>
            </View>
            <View className="flex-1 flex-row items-center">
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
              {hasSubcategories && (
                isExpanded ? 
                  <ChevronDown size={22} color={isDarkMode ? '#FFFFFF' : '#000000'} /> : 
                  <ChevronRight size={22} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              )}
            </View>
          </TouchableOpacity>
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => openAddSubcategoryModal(item)}
              className="mr-4"
            >
              <SlidersHorizontal
                size={22}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              className="mr-4"
            >
              <Edit
                size={22}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
              <Trash
                size={22}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && item.subcategories && item.subcategories.map(subcategory => (
          <View key={subcategory.id}>
            {renderSubcategoryItem({ item: subcategory, parentCategory: item })}
          </View>
        ))}
      </View>
    );
  };

  const EmptyListComponent = () => (
    <View className="flex-1 items-center justify-center">
      <FolderOpen
        size={80}
        color={isDarkMode ? '#666666' : '#999999'}
      />
      <Text className={`mt-4 text-lg font-montserrat-medium text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        No categories yet
      </Text>
      <Text className={`mt-2 text-sm font-montserrat text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        Add a category to get started
      </Text>
    </View>
  );

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6 flex-1">
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>

      <TouchableOpacity
        onPress={openAddModal}
        className={`absolute bottom-8 right-8 w-14 h-14 rounded-full items-center justify-center ${
          isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
        }`}
        style={{ elevation: 5 }}
      >
        <Plus size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Category Modal */}
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
                  className="w-16 h-16 rounded-[20px] items-center justify-center mr-4"
                  style={{ borderColor: formData.color, borderWidth: 2 }}
                >
                  <TextInput
                    className="text-3xl text-center"
                    value={formData.icon}
                    onChangeText={handleIconChange}
                    placeholder="📚"
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
                isDarkMode ? 'text-gray-400/50' : 'text-gray-500/50'
              }`}>
                * Add custom emoji for the icon
              </Text>

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

      {/* Subcategory Modal */}
      <Modal
        visible={isSubcategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeSubcategoryModal}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={closeSubcategoryModal}
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
                {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
              </Text>

              {parentCategoryForSubcategory && (
                <View className={`mb-6 p-3 rounded-[20px] ${
                  isDarkMode ? 'bg-slate-800' : 'bg-Surface'
                }`}>
                  <Text className={`font-montserrat text-sm ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}>
                    Parent Category
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View 
                      className="w-8 h-8 rounded-full items-center justify-center mr-2"
                      style={{ borderColor: parentCategoryForSubcategory.color, borderWidth: 2 }}
                    >
                      <Text className="text-lg">{parentCategoryForSubcategory.icon}</Text>
                    </View>
                    <Text className={`font-montserrat-medium ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {parentCategoryForSubcategory.name}
                    </Text>
                  </View>
                </View>
              )}

              <View className="mb-6">
                <Text className={`font-montserrat-medium mb-2 ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  Name
                </Text>
                <TextInput
                  className={`p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-BackgroundDark text-TextPrimaryDark' 
                      : 'bg-white text-TextPrimary'
                  }`}
                  placeholder="Subcategory Name"
                  placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                  value={subcategoryFormData.name}
                  onChangeText={handleSubcategoryNameChange}
                />
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
                    onPress={() => setSubcategoryFormData(prev => ({ ...prev, color }))}
                    className={`w-10 h-10 rounded-full ${
                      subcategoryFormData.color === color
                        ? 'border-2 border-white'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </View>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  onPress={closeSubcategoryModal}
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
                  onPress={editingSubcategory ? handleEditSubcategory : handleAddSubcategory}
                  className={`p-4 rounded-lg flex-1 ml-2 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text className="text-white text-center font-montserrat-semibold">
                    {editingSubcategory ? 'Update' : 'Add'}
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