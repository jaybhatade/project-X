import React, { createContext, useContext, useEffect, useState } from 'react';
import { setupDatabase } from '../../db/db';
import { useAuth } from './AuthContext';

interface DatabaseContextType {
  isInitialized: boolean;
  reinitializeDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  reinitializeDatabase: async () => {},
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDatabase = async () => {
    if (user) {
      try {
        await setupDatabase(user.uid);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    }
  };

  const reinitializeDatabase = async () => {
    setIsInitialized(false);
    await initializeDatabase();
  };

  useEffect(() => {
    initializeDatabase();
  }, [user]);

  return (
    <DatabaseContext.Provider value={{ 
      isInitialized,
      reinitializeDatabase
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};