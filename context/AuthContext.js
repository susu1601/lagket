// Auth Context for managing user state with Firebase
import React, { createContext, useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerUser, logoutUser, onAuthStateChange, updateUserAvatar } from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const user = await loginUser(email, password);
    setUser(user);
    return user;
  };

  const register = async (email, password) => {
    const user = await registerUser(email, password);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const updateAvatar = async (fileUri) => {
    if (!user?.uid) {
      throw new Error("Người dùng chưa đăng nhập");
    }
    
    const avatarUrl = await updateUserAvatar(user.uid, fileUri);
    
    // Update local user state
    setUser(prevUser => ({
      ...prevUser,
      avatar: avatarUrl
    }));
    
    return avatarUrl;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      initializing, 
      login, 
      register, 
      logout,
      updateAvatar
    }}>
      {children}
    </AuthContext.Provider>
  );
}