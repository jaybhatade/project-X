import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import CategorySelection from './CategorySelection';

interface CategorySelectionTriggerProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  categoryType?: 'expense' | 'income' | 'all';
  buttonLabel?: string;
  getCategoryById: (id: string) => any;
}

const CategorySelectionTrigger: React.FC<CategorySelectionTriggerProps> = ({
  selectedCategory,
  onCategorySelect,
  categoryType = 'all',
  buttonLabel = 'Select Category',
  getCategoryById
}) => {
  const { isDarkMode } = useTheme();
  const [showCategorySelection, setShowCategorySelection] = useState<boolean>(false);
  
  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    setShowCategorySelection(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.categorySelector,
          { 
            backgroundColor: isDarkMode ? '#333333' : '#F5F5F5',
            borderColor: isDarkMode ? '#555555' : '#DDDDDD'
          }
        ]}
        onPress={() => setShowCategorySelection(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View 
              style={[
                styles.categoryIcon,
                { 
                 borderColor: getCategoryById(selectedCategory)?.color || '#21965B', borderWidth: 2
                }
              ]}
            >
              <Text style={{ color: '#FFFFFF' }}>
                {getCategoryById(selectedCategory)?.icon || '📦'}
              </Text>
            </View>
            <Text 
              style={{ 
                color: isDarkMode ? '#FFFFFF' : '#000000',
                marginLeft: 10
              }}
            >
              {getCategoryById(selectedCategory)?.name || buttonLabel}
            </Text>
          </View>
        ) : (
          <Text 
            style={{ 
              color: isDarkMode ? '#B0B0B0' : '#707070' 
            }}
          >
            {buttonLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Full-page Category Selection Modal */}
      <Modal
        visible={showCategorySelection}
        animationType="slide"
        onRequestClose={() => setShowCategorySelection(false)}
      >
        <CategorySelection
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          categoryType={categoryType}
          headerTitle={`Select ${categoryType === 'expense' ? 'Expense' : categoryType === 'income' ? 'Income' : ''} Category`}
          onClose={() => setShowCategorySelection(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  categorySelector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategorySelectionTrigger; 