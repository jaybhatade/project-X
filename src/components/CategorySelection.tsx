import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as db from '../../db/db';

interface CategorySelectionProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  categoryType?: 'expense' | 'income' | 'all';
  headerTitle?: string;
  onClose: () => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  selectedCategory,
  onCategorySelect,
  categoryType = 'all',
  headerTitle = 'Select Category',
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await db.getAllCategories();
        // Filter categories by type if specified
        let typeFilteredCategories = allCategories;
        if (categoryType !== 'all') {
          typeFilteredCategories = allCategories.filter(cat => cat.type === categoryType);
        }
        setCategories(typeFilteredCategories);
        setFilteredCategories(typeFilteredCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [categoryType]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
    ]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onClose}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDarkMode ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          {headerTitle}
        </Text>
        <View style={styles.placeholderButton} />
      </View>
      
      {/* Search Bar */}
      <View style={[
        styles.searchContainer, 
        { backgroundColor: isDarkMode ? '#333333' : '#F5F5F5' }
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isDarkMode ? '#B0B0B0' : '#707070'} 
          style={styles.searchIcon}
        />
        <TextInput 
          style={[
            styles.searchInput,
            { color: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}
          placeholder="Search categories"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory === item.id && {
                backgroundColor: isDarkMode ? '#333333' : '#E0E0E0'
              }
            ]}
            onPress={() => {
              onCategorySelect(item.id);
              onClose();
            }}
          >
            <View 
              style={[
                styles.categoryIcon,
                { borderColor: item.color, borderWidth: 2}
              ]}
            >
              <Text style={{ color: '#FFFFFF' }}>{item.icon}</Text>
            </View>
            <Text 
              style={{ 
                color: isDarkMode ? '#FFFFFF' : '#000000',
                marginLeft: 10,
                fontSize: 16
              }}
            >
              {item.name}
            </Text>
            {selectedCategory === item.id && (
              <Ionicons 
                name="checkmark" 
                size={20} 
                color={isDarkMode ? '#FFFFFF' : '#21965B'}
                style={{ marginLeft: 'auto' }}
              />
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View 
            style={[
              styles.separator,
              { backgroundColor: isDarkMode ? '#333333' : '#EEEEEE' }
            ]} 
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ 
              color: isDarkMode ? '#B0B0B0' : '#707070',
              textAlign: 'center',
              marginTop: 24
            }}>
              No categories found
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  }
});

export default CategorySelection;