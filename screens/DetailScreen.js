import React, { useEffect, useState, useContext } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { subscribePhotoUpdates, refreshLabels, deletePhotoLocal } from "../services/cloudinaryPhotoService";
import Button from "../components/Button";
import Card from "../components/Card";

export default function DetailScreen({ route, navigation }) {
  const initialPhoto = route?.params?.photo;
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [photo, setPhoto] = useState(initialPhoto);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && initialPhoto?.id) {
      const unsubscribe = subscribePhotoUpdates(user.id, initialPhoto.id, setPhoto, 1500);
      return unsubscribe;
    }
  }, [user?.id, initialPhoto?.id]);

  if (!photo) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="image-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
          Không có ảnh 🥲
        </Text>
      </View>
    );
  }

  const onRefreshLabels = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await refreshLabels(user.id, photo.id, photo.uri);
      Alert.alert("Thành công", "Đã cập nhật nhãn ảnh");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật nhãn ảnh");
    } finally {
      setRefreshing(false);
    }
  };

  const onDelete = async () => {
    if (!user || !photo?.id) return;
    try {
      await deletePhotoLocal(user.id, photo.id);
      navigation.goBack();
    } catch {}
  };

  // Support both old and new data formats
  const labels = photo.labels || photo.aiAnalysis?.labels || photo.tags || [];
  const hasLabels = Array.isArray(labels) && labels.length > 0;
  const imageUri = photo.cloudinaryUrl || photo.uri || photo.localUri;
  const timestamp = photo.timestamp || photo.createdAt;
  const coords = photo.coords || photo.location;
  const note = photo.note || photo.caption || "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Header actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash" size={22} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image}
          onError={(error) => {
            console.warn("❌ Image load error:", error.nativeEvent.error);
          }}
        />
        
        {/* Status indicator */}
        <View style={styles.statusBadge}>
          {photo.cloudinary ? (
            <View style={[styles.statusItem, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="cloud" size={16} color="white" />
              <Text style={styles.statusText}>Cloudinary</Text>
            </View>
          ) : photo.localOnly ? (
            <View style={[styles.statusItem, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="phone-portrait" size={16} color="white" />
              <Text style={styles.statusText}>Local Only</Text>
            </View>
          ) : (
            <View style={[styles.statusItem, { backgroundColor: theme.colors.textTertiary }]}>
              <Ionicons name="image" size={16} color="white" />
              <Text style={styles.statusText}>Unknown</Text>
            </View>
          )}
        </View>
      </View>

      {/* Photo Info */}
      <Card variant="elevated" style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Thông tin ảnh
        </Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {timestamp ? new Date(timestamp).toLocaleString('vi-VN') : 'N/A'}
          </Text>
        </View>
        
        {photo.userId && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              User: {photo.userId}
            </Text>
          </View>
        )}
        
        {photo.cloudinary && (
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {photo.cloudinary.width} × {photo.cloudinary.height} px
            </Text>
          </View>
        )}
        
        {coords && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {coords.latitude?.toFixed(5)}, {coords.longitude?.toFixed(5)}
            </Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {note || "Không có ghi chú"}
          </Text>
        </View>
      </Card>

      {/* Labels */}
      <Card variant="elevated" style={styles.labelsCard}>
        <View style={styles.labelsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Nhãn AI
          </Text>
          <TouchableOpacity onPress={onRefreshLabels} disabled={refreshing}>
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? theme.colors.textTertiary : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
        
        {hasLabels ? (
          <View style={styles.labelsContainer}>
            {labels.map((label, index) => (
              <View 
                key={index} 
                style={[styles.labelChip, { backgroundColor: theme.colors.primary + '20' }]}
              >
                <Text style={[styles.labelText, { color: theme.colors.primary }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.noLabelsText, { color: theme.colors.textTertiary }]}>
            {refreshing ? "Đang nhận diện..." : "Chưa có nhãn"}
          </Text>
        )}
      </Card>

      {/* Map */}
      {coords && (
        <Card variant="elevated" style={styles.mapCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Vị trí
          </Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: coords.latitude,
                longitude: coords.longitude,
              }}
            />
          </MapView>
        </Card>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  imageContainer: {
    position: 'relative',
  },
  image: { 
    width: "100%", 
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
  },
  labelsCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  mapCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  labelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noLabelsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  map: { 
    height: 250,
    borderRadius: 8,
  },
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
});


