import { StatusBar } from 'expo-status-bar';
import './global.css';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DatabaseProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </DatabaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
