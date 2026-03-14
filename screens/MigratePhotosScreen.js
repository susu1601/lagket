import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getAllPhotos } from "../services/cloudinaryPhotoService";
import { addPhotoToUserAlbum } from "../services/userAlbumService";

export default function MigratePhotosScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [log, setLog] = useState([]);

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const migratePhotos = async () => {
    if (!user) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập");
      return;
    }

    Alert.alert(
      "Xác nhận",
      "Migrate tất cả ảnh từ Cloudinary sang Firebase?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Migrate",
          onPress: async () => {
            setMigrating(true);
            setLog([]);
            
            try {
              addLog("🔍 Đang lấy danh sách ảnh từ Cloudinary...");
              
              // Get all photos from Cloudinary
              const photos = await getAllPhotos(user.uid);
              
              addLog(`📊 Tìm thấy ${photos.length} ảnh`);
              setProgress({ current: 0, total: photos.length });
              
              if (photos.length === 0) {
                addLog("⚠️ Không có ảnh nào để migrate");
                Alert.alert("Thông báo", "Không có ảnh nào để migrate");
                setMigrating(false);
                return;
              }
              
              let success = 0;
              let failed = 0;
              
              for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                
                try {
                  addLog(`📸 [${i + 1}/${photos.length}] Đang migrate: ${photo.id}`);
                  
                  // Map Cloudinary photo format to Firebase format
                  await addPhotoToUserAlbum(user.uid, {
                    id: photo.id,
                    cloudinaryUrl: photo.uri, // Cloudinary URL is stored in 'uri' field
                    publicId: photo.cloudinary?.publicId || photo.id,
                    caption: photo.note || "",
                    tags: photo.labels || [],
                    location: photo.coords ? {
                      latitude: photo.coords.latitude,
                      longitude: photo.coords.longitude,
                      address: null
                    } : null,
                    aiAnalysis: {
                      labels: photo.labels || [],
                      categoryPrimary: photo.categoryPrimary,
                      categorySecondary: photo.categorySecondary
                    }
                  });
                  
                  success++;
                  setProgress({ current: i + 1, total: photos.length });
                  
                } catch (error) {
                  addLog(`❌ Lỗi migrate ${photo.id}: ${error.message}`);
                  failed++;
                }
              }
              
              addLog(`\n✅ Hoàn thành!`);
              addLog(`   Thành công: ${success}`);
              addLog(`   Thất bại: ${failed}`);
              
              Alert.alert(
                "Hoàn thành",
                `Đã migrate ${success}/${photos.length} ảnh thành công!`
              );
              
            } catch (error) {
              addLog(`❌ Lỗi: ${error.message}`);
              Alert.alert("Lỗi", error.message);
            } finally {
              setMigrating(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Migrate Photos</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="information-circle" size={48} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Migrate Ảnh sang Firebase
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Chuyển tất cả ảnh từ Cloudinary sang Firebase để bạn bè có thể xem album của bạn.
          </Text>
          
          {!migrating && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={migratePhotos}
            >
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.buttonText}>Bắt đầu Migrate</Text>
            </TouchableOpacity>
          )}
          
          {migrating && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                Đang migrate {progress.current}/{progress.total}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.colors.primary,
                      width: `${(progress.current / progress.total) * 100}%`
                    }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {log.length > 0 && (
          <View style={[styles.logContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.logTitle, { color: theme.colors.text }]}>
              📝 Log
            </Text>
            {log.map((line, index) => (
              <Text 
                key={index} 
                style={[styles.logLine, { color: theme.colors.textSecondary }]}
              >
                {line}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    width: "100%",
  },
  progressText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  logContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  logLine: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
