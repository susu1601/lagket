import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { uploadImageToCloudinary } from '../services/cloudinaryPhotoService';
import Button from './Button';
import Card from './Card';

export default function CloudinaryTest() {
  const { theme } = useTheme();
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test với một URL ảnh mẫu
      const testImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";
      
      console.log("🧪 Testing Cloudinary upload...");
      const result = await uploadImageToCloudinary(testImageUrl, "test_user");
      
      setTestResult({
        success: true,
        message: "Cloudinary upload successful!",
        data: {
          publicId: result.publicId,
          secureUrl: result.secureUrl,
          width: result.width,
          height: result.height
        }
      });
      
      Alert.alert("Thành công", "Cloudinary upload hoạt động bình thường!");
      
    } catch (error) {
      console.error("❌ Cloudinary test failed:", error);
      setTestResult({
        success: false,
        error: error.message
      });
      
      Alert.alert("Lỗi", `Cloudinary upload failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        🧪 Cloudinary Upload Test
      </Text>
      
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Test Cloudinary upload với ảnh mẫu
      </Text>

      <Button
        title={isLoading ? "Testing..." : "Test Upload"}
        onPress={runTest}
        loading={isLoading}
        style={styles.testButton}
      />

      {testResult && (
        <View style={[
          styles.resultContainer,
          { 
            backgroundColor: testResult.success 
              ? theme.colors.success + '20' 
              : theme.colors.error + '20',
            borderColor: testResult.success 
              ? theme.colors.success 
              : theme.colors.error
          }
        ]}>
          <Text style={[
            styles.resultTitle,
            { 
              color: testResult.success 
                ? theme.colors.success 
                : theme.colors.error 
            }
          ]}>
            {testResult.success ? "✅ Success" : "❌ Failed"}
          </Text>
          
          {testResult.message && (
            <Text style={[styles.resultMessage, { color: theme.colors.textPrimary }]}>
              {testResult.message}
            </Text>
          )}
          
          {testResult.error && (
            <Text style={[styles.resultError, { color: theme.colors.error }]}>
              Error: {testResult.error}
            </Text>
          )}
          
          {testResult.data && (
            <View style={styles.dataContainer}>
              <Text style={[styles.dataTitle, { color: theme.colors.textPrimary }]}>
                Upload Data:
              </Text>
              <Text style={[styles.dataText, { color: theme.colors.textSecondary }]}>
                Public ID: {testResult.data.publicId}
              </Text>
              <Text style={[styles.dataText, { color: theme.colors.textSecondary }]}>
                Size: {testResult.data.width} × {testResult.data.height}
              </Text>
              <Text style={[styles.dataText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                URL: {testResult.data.secureUrl}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    marginBottom: 16,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultError: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  dataContainer: {
    marginTop: 12,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
