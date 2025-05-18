import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  label: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onChange, label }) => {
  const { isDarkMode } = useTheme();
  const [show, setShow] = React.useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    onChange(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text 
      className='montserrat-bold'
      style={{
        fontSize: 16,
        marginBottom: 8,
        color: isDarkMode ? '#FFFFFF' : '#000000',
      }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={showDatepicker}
        style={{
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 10,
          padding: 12,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Text style={{
          fontSize: 16,
          color: isDarkMode ? '#FFFFFF' : '#000000',
        }}>
          {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

export default DatePicker;