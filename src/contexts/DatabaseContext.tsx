import React, { createContext, useContext, useEffect } from 'react';
import { setupDatabase } from '../../db/db';

interface DatabaseContextType {
  // Add any database-related methods here
  isInitialized: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    try {
      setupDatabase();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }, []);

  return (
    <DatabaseContext.Provider value={{ isInitialized }}>
      {children}
    </DatabaseContext.Provider>
  );
}; 