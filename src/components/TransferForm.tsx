import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import DatePicker from './DatePicker';
import { Ionicons } from '@expo/vector-icons';

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransferFormProps {
  amount: string;
  setAmount: (amount: string) => void;
  note: string;
  setNote: (note: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  fromAccountId: string;
  setFromAccountId: (id: string) => void;
  toAccountId: string;
  setToAccountId: (id: string) => void;
  accounts: Account[];
  showFromAccountModal: boolean;
  setShowFromAccountModal: (show: boolean) => void;
  showToAccountModal: boolean;
  setShowToAccountModal: (show: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  amount,
  setAmount,
  note,
  setNote,
  date,
  setDate,
  fromAccountId,
  setFromAccountId,
  toAccountId,
  setToAccountId,
  accounts,
  showFromAccountModal,
  setShowFromAccountModal,
  showToAccountModal,
  setShowToAccountModal,
}) => {
  const { isDarkMode } = useTheme();

  const handleAccountSelect = (accountId: string, isFromAccount: boolean) => {
    if (isFromAccount) {
      if (accountId === toAccountId) {
        Alert.alert('Invalid Selection', 'Cannot select the same account for both source and destination');
        return;
      }
      setFromAccountId(accountId);
      setShowFromAccountModal(false);
    } else {
      if (accountId === fromAccountId) {
        Alert.alert('Invalid Selection', 'Cannot select the same account for both source and destination');
        return;
      }
      setToAccountId(accountId);
      setShowToAccountModal(false);
    }
  };

  const AccountSelector = ({ isFromAccount }: { isFromAccount: boolean }) => {
    const accountId = isFromAccount ? fromAccountId : toAccountId;
    const account = accounts.find(acc => acc.id === accountId);
    const showModal = isFromAccount ? showFromAccountModal : showToAccountModal;
    const setShowModal = isFromAccount ? setShowFromAccountModal : setShowToAccountModal;

    const filteredAccounts = accounts.filter(acc => {
      if (isFromAccount) {
        return acc.id !== toAccountId;
      } else {
        return acc.id !== fromAccountId;
      }
    });

    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {isFromAccount ? 'From Account' : 'To Account'}
        </Text>
        <TouchableOpacity
          style={[styles.accountSelector, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}
          onPress={() => setShowModal(true)}
        >
          {account ? (
            <View style={styles.selectedAccount}>
              <Text style={{ fontSize: 24, color: '#000' }}>{account.icon}</Text>
              <View>
                <Text style={[styles.accountName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {account.name}
                </Text>
                <Text style={styles.accountBalance}>Balance: ₹{account.balance}</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: isDarkMode ? '#B0B0B0' : '#707070' }]}>
              Select {isFromAccount ? 'source' : 'destination'} account
            </Text>
          )}
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }]}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                Select {isFromAccount ? 'Source' : 'Destination'} Account
              </Text>
              {filteredAccounts.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.accountItem}
                  onPress={() => handleAccountSelect(acc.id, isFromAccount)}
                >
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{acc.icon}</Text>
                  <View>
                    <Text style={[styles.accountName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                      {acc.name}
                    </Text>
                    <Text style={styles.accountBalance}>Balance: ₹{acc.balance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={{ color: '#21965B', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Amount</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
        />
      </View>

      <AccountSelector isFromAccount={true} />
      <AccountSelector isFromAccount={false} />

      <DatePicker
        date={date}
        onChange={setDate}
        label="Date"
      />

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', color: isDarkMode ? '#FFFFFF' : '#000000' }]}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
          multiline
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noteInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  accountSelector: {
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    marginLeft: 10,
    fontSize: 16,
  },
  accountBalance: {
    marginLeft: 10,
    fontSize: 14,
    color: '#707070',
  },
  placeholder: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    marginTop: 15,
    alignSelf: 'flex-end',
  },
});

export default TransferForm;