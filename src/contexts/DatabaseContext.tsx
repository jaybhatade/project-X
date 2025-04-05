import React, { createContext, useContext, useEffect } from 'react';
import { setupDatabase } from '../../db/db';
import { useAuth } from './AuthContext';

interface DatabaseContextType {
  // Add any database-related methods here
  isInitialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initDb = async () => {
      if (user) {
        try {
          await setupDatabase(user.uid);
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize database:', error);
        }
      }
    };

    initDb();
  }, [user]);

  return (
    <DatabaseContext.Provider value={{ isInitialized }}>
      {children}
    </DatabaseContext.Provider>
  );
};