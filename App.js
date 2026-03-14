import React from "react";
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider as OldThemeProvider } from "./context/ThemeContext";
import { ThemeProvider } from "./hooks/useTheme";
import { ReloadProvider } from "./context/ReloadContext";

export default function App() {
  return (
    <ThemeProvider>
      <OldThemeProvider>
        <ReloadProvider>
          <AppNavigator />
        </ReloadProvider>
      </OldThemeProvider>
    </ThemeProvider>
  );
}


