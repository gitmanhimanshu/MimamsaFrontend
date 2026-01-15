import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import BookDetailScreen from "../screens/BookDetailScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import AddBookScreen from "../screens/AddBookScreen";
import ManageAuthorsScreen from "../screens/ManageAuthorsScreen";
import ReaderScreen from "../screens/ReaderScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SplashScreen from "../screens/SplashScreen";
import { View, ActivityIndicator, StyleSheet } from "react-native";

interface UserData {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  profile_photo?: string;
}

const STORAGE_KEY = '@user_session';

export default function RootLayout() {
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [currentScreen, setCurrentScreen] = useState("Home");
  const [screenData, setScreenData] = useState<any>(null);
  const [navigationStack, setNavigationStack] = useState<Array<{screen: string, data?: any}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Load user session on app start
  useEffect(() => {
    loadUserSession();
  }, []);

  const loadUserSession = async () => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setCurrentScreen("Home");
      }
    } catch (error) {
      console.error('Failed to load user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSession = async (userData: UserData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user session:', error);
    }
  };

  const clearUserSession = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  };

  const handleLoginSuccess = async (userData: UserData) => {
    setUser(userData);
    setCurrentScreen("Home");
    await saveUserSession(userData);
  };

  const handleUpdateUser = async (userData: UserData) => {
    setUser(userData);
    await saveUserSession(userData);
  };

  const handleLogout = async () => {
    setUser(null);
    setShowLogin(true);
    setCurrentScreen("Home");
    await clearUserSession();
  };

  const handleNavigate = (screen: string, data?: any) => {
    // Push current screen to stack before navigating
    setNavigationStack(prev => [...prev, { screen: currentScreen, data: screenData }]);
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleBack = () => {
    // Pop from navigation stack
    if (navigationStack.length > 0) {
      const previous = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentScreen(previous.screen);
      setScreenData(previous.data);
    } else {
      // If stack is empty, go to Home
      setCurrentScreen("Home");
      setScreenData(null);
    }
  };

  // Show loading screen while checking session
  if (isLoading || showSplash) {
    return showSplash ? (
      <SplashScreen onFinish={() => setShowSplash(false)} />
    ) : (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  // If user is not logged in, show auth screens
  if (!user) {
    return showLogin ? 
      <LoginScreen 
        onSwitchToRegister={() => setShowLogin(false)} 
        onLoginSuccess={handleLoginSuccess}
      /> : 
      <RegisterScreen onSwitchToLogin={() => setShowLogin(true)} />;
  }

  // User is logged in, show app screens
  switch (currentScreen) {
    case "Profile":
      return <ProfileScreen user={user} onBack={handleBack} onUpdateUser={handleUpdateUser} />;
    
    case "BookDetail":
      return <BookDetailScreen book={screenData?.book} onBack={handleBack} onNavigate={handleNavigate} />;
    
    case "Reader":
      return <ReaderScreen book={screenData?.book} onBack={handleBack} />;
    
    case "AdminPanel":
      return <AdminPanelScreen user={user} onBack={handleBack} onNavigate={handleNavigate} />;
    
    case "ManageAuthors":
      return <ManageAuthorsScreen user={user} onBack={handleBack} onAuthorAdded={() => {}} />;
    
    case "AddBook":
      return <AddBookScreen user={user} onBack={handleBack} onNavigate={handleNavigate} />;
    
    case "EditBook":
      return <AddBookScreen user={user} onBack={handleBack} onNavigate={handleNavigate} book={screenData?.book} />;
    
    default:
      return <HomeScreen user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
});
