import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
  ActivityIndicator
} from "react-native";
import SafeImage from "../components/SafeImage";
import { Ionicons } from "@expo/vector-icons";
import { getUserAlbum } from "../services/userAlbumService";
import { AuthContext } from "../context/AuthContext";
import { deletePhotoFromCloudinary } from "../services/cloudinaryPhotoService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;
const GRID_ITEM_SIZE = (width - 32) / 4; // 4 columns for grid view
const FEATURED_SIZE = width * 0.7;

export default function AlbumScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('collections'); // 'collections' or 'all'
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  const loadPhotos = async () => {
    if (!user?.uid) return;
    try {
      const albumData = await getUserAlbum(user.uid);
      setPhotos(albumData.photos);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPhotos(new Set());
  };

  const togglePhotoSelection = (photoId) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return;

    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa ${selectedPhotos.size} ảnh đã chọn?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const photosToDelete = photos.filter(p => selectedPhotos.has(p.id));

              for (const photo of photosToDelete) {
                await deletePhotoFromCloudinary(photo.id, user.uid);
              }

              Alert.alert('Thành công', `Đã xóa ${selectedPhotos.size} ảnh`);
              setSelectedPhotos(new Set());
              setSelectionMode(false);
              await loadPhotos();
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Lỗi', 'Không thể xóa ảnh. Vui lòng thử lại.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };


  // Featured photos (recent or with location)
  const featuredPhotos = useMemo(() => {
    return photos
      .filter(p => p.location || p.aiAnalysis?.labels?.length > 0)
      .slice(0, 10);
  }, [photos]);

  // Group photos by tags
  const photosByTag = useMemo(() => {
    const tagMap = {};
    photos.forEach(photo => {
      const labels = photo.aiAnalysis?.labels || photo.tags || [];
      labels.forEach(tag => {
        if (!tagMap[tag]) {
          tagMap[tag] = [];
        }
        tagMap[tag].push(photo);
      });
    });

    // Sort by number of photos and take top tags
    return Object.entries(tagMap)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8)
      .map(([tag, photos]) => ({ tag, photos }));
  }, [photos]);

  const renderFeaturedPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredItem}
      onPress={() => {
        if (selectionMode) {
          togglePhotoSelection(item.id);
        } else {
          navigateToPhotoDetail(navigation, item, user);
        }
      }}>
      <SafeImage
        source={{ uri: item.cloudinaryUrl }}
        style={styles.featuredImage}
        resizeMode="cover"
      />
      <View style={styles.featuredGradient} />
      {selectionMode && (
        <View style={styles.selectionOverlay}>
          <View style={[
            styles.checkbox,
            selectedPhotos.has(item.id) && styles.checkboxSelected
          ]}>
            {selectedPhotos.has(item.id) && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTagCollection = ({ tag, photos: tagPhotos }) => (
    <View key={tag} style={styles.tagSection}>
      <TouchableOpacity
        style={styles.tagHeader}
        onPress={() => navigation.navigate('AlbumByTag', { tag })}>
        <Text style={styles.tagTitle}>{tag}</Text>
        <View style={styles.tagRight}>
          <Text style={styles.tagCount}>{tagPhotos.length}</Text>
          <Ionicons name="chevron-forward" size={18} color="#c7c7cc" />
        </View>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagPhotos}>
        {tagPhotos.slice(0, 6).map(photo => (
          <TouchableOpacity
            key={photo.id}
            style={styles.tagPhotoItem}
            onPress={() => {
              if (selectionMode) {
                togglePhotoSelection(photo.id);
              } else {
                navigateToPhotoDetail(navigation, photo, user);
              }
            }}>
            <SafeImage
              source={{ uri: photo.cloudinaryUrl }}
              style={styles.tagPhotoImage}
              resizeMode="cover"
            />
            {selectionMode && (
              <View style={styles.selectionOverlay}>
                <View style={[
                  styles.checkbox,
                  selectedPhotos.has(photo.id) && styles.checkboxSelected
                ]}>
                  {selectedPhotos.has(photo.id) && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Album</Text>
        <View style={styles.headerButtons}>
          {selectionMode ? (
            <>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={selectedPhotos.size === 0}
                style={[styles.headerButton, selectedPhotos.size === 0 && styles.disabledButton]}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={selectedPhotos.size === 0 ? "#ccc" : "#ff3b30"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleSelectionMode}
                style={styles.headerButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={toggleSelectionMode}
                style={styles.headerButton}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Camera')}
                style={styles.headerButton}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

        {/* Stats */}
        <View style={styles.statsBar}>
          {selectionMode ? (
            <Text style={styles.statsText}>
              {selectedPhotos.size > 0 ? `${selectedPhotos.size} ảnh đã chọn` : 'Chọn ảnh để xóa'}
            </Text>
          ) : (
            <View style={styles.statsPill}>
              <Ionicons name="images" size={14} color="#ffcc00" style={{ marginRight: 4 }} />
              <Text style={styles.statsText}>{photos.length} ảnh</Text>
              <View style={styles.statsDivider} />
              <Ionicons name="flame" size={14} color="#ff3b30" style={{ marginRight: 4 }} />
              <Text style={styles.statsText}>0d chuỗi</Text>
            </View>
          )}
        </View>

        {/* Featured Photos */}
        {featuredPhotos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderSimple}>
              <Text style={styles.sectionTitle}>Nổi bật</Text>
            </View>
            <FlatList
              horizontal
              data={featuredPhotos}
              renderItem={renderFeaturedPhoto}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Collections by Tag or All Photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {viewMode === 'collections' ? 'Bộ sưu tập' : 'Tất cả ảnh'}
              </Text>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'collections' ? 'all' : 'collections')}
                style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>
                  {viewMode === 'collections' ? 'Xem tất cả' : 'Bộ sưu tập'}
                </Text>
                <Ionicons
                  name={viewMode === 'collections' ? 'grid-outline' : 'albums-outline'}
                  size={18}
                  color="#ffcc00"
                />
              </TouchableOpacity>
            </View>

            {viewMode === 'collections' ? (
              photosByTag.map(item => renderTagCollection(item))
            ) : (
              <View style={styles.allPhotosGrid}>
                {photos.map(photo => (
                  <TouchableOpacity
                    key={photo.id}
                    style={styles.gridPhotoItem}
                    onPress={() => {
                      if (selectionMode) {
                        togglePhotoSelection(photo.id);
                      } else {
                        navigateToPhotoDetail(navigation, photo, user);
                      }
                    }}>
                    <SafeImage
                      source={{ uri: photo.cloudinaryUrl }}
                      style={styles.gridPhotoImage}
                      resizeMode="cover"
                    />
                    {selectionMode && (
                      <View style={styles.selectionOverlay}>
                        <View style={[
                          styles.checkbox,
                          selectedPhotos.has(photo.id) && styles.checkboxSelected
                        ]}>
                          {selectedPhotos.has(photo.id) && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {photos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
            <Text style={styles.emptySubtext}>Chụp ảnh để bắt đầu bộ sưu tập của bạn</Text>
          </View>
        )}
      </ScrollView>

      {deleting && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="large" color="#ff3b30" />
            <Text style={styles.uploadingText}>Đang xóa...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
  },
  statsBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  statsDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#444',
    marginHorizontal: 10,
  },
  section: {
    marginTop: 32,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderSimple: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffcc00',
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featuredItem: {
    width: FEATURED_SIZE,
    height: FEATURED_SIZE * 1.1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  tagSection: {
    marginBottom: 28,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  tagTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.4,
  },
  tagRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagCount: {
    fontSize: 15,
    color: '#8e8e93',
    fontWeight: '400',
  },
  tagPhotos: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagPhotoItem: {
    width: 110,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
  },
  tagPhotoImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingBox: {
    backgroundColor: '#222',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  uploadingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  allPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridPhotoItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    margin: 2,
  },
  gridPhotoImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
