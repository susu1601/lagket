// Enhanced Loading Component with theme support
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function Loading({ 
  size = "large", 
  text = "Đang tải...", 
  showText = true,
  color 
}) {
  const { theme } = useTheme();
  
  const indicatorColor = color || theme.colors.primary;
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {showText && (
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
