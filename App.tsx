import './global.css';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    "Figtree-Regular": require("./assets/fonts/Figtree-Regular.ttf"),
    "Figtree-Medium": require("./assets/fonts/Figtree-Medium.ttf"),
    "Figtree-SemiBold": require("./assets/fonts/Figtree-SemiBold.ttf"),
    "Figtree-Bold": require("./assets/fonts/Figtree-Bold.ttf"),
    "Figtree-ExtraBold": require("./assets/fonts/Figtree-ExtraBold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <DatabaseProvider>
            <AppNavigator />
            <StatusBar barStyle="default" />
          </DatabaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaView>
  );
}
