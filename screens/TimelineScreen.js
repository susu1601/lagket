import React, { useEffect, useState, useContext } from "react";
import { 
  View,
  Text,
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  RefreshControl
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserAlbum } from "../services/userAlbumService";
import { navigateToPhotoDetail } from "../utils/navigationHelper";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;
const DAY_WIDTH = (width - 40) / 7;

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export default function TimelineScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [photos, setPhotos] = useState([]);
  const [photosByDate, setPhotosByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPhotos();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPhotos = async () => {
    if (!user?.uid) return;
    try {
      const albumData = await getUserAlbum(user.uid);
      const sorted = [...albumData.photos].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setPhotos(sorted);
      
      // Group photos by date
      const grouped = {};
      sorted.forEach(photo => {
        if (photo.createdAt) {
          const date = new Date(photo.createdAt).toISOString().split('T')[0];
          if (!grouped[date]) {
            grouped[date] = [];
          }
          grouped[date].push(photo);
        }
      });
      setPhotosByDate(grouped);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };

  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const onDayPress = (day) => {
    if (!day) return;
    const [year, month] = currentMonth.split('-');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedPhotos(photosByDate[dateStr] || []);
  };

  const changeMonth = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + direction;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    setSelectedDate('');
    setSelectedPhotos([]);
  };

  const renderDay = (day, index) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.dayCell} />;
    }
    
    const [year, month] = currentMonth.split('-');
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    const dayPhotos = photosByDate[dateStr] || [];
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    
    return (
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDay,
          isToday && styles.todayCell
        ]}
        onPress={() => onDayPress(day)}>
        <Text style={[
          styles.dayText,
          isSelected && styles.selectedDayText,
          isToday && styles.todayText
        ]}>
          {day}
        </Text>
        {dayPhotos.length > 0 && (
          <View style={styles.photoThumbnailContainer}>
            <Image 
              source={{ uri: dayPhotos[0].cloudinaryUrl }} 
              style={styles.photoThumbnail}
            />
            {dayPhotos.length > 1 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>{dayPhotos.length}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPhoto = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => navigateToPhotoDetail(navigation, item, user)}>
      <Image 
        source={{ uri: item.cloudinaryUrl }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const [year, month] = currentMonth.split('-').map(Number);
  const days = getDaysInMonth(year, month - 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch ảnh</Text>
        <View style={styles.headerRight}>
 
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#54b6f8']}
            tintColor="#54b6f8"
          />
        }>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color="#54b6f8" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[month - 1]} {year}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={24} color="#54b6f8" />
          </TouchableOpacity>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => renderDay(day, index))}
        </View>

        {selectedPhotos.length > 0 && (
          <View style={styles.selectedDateSection}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {new Date(selectedDate).toLocaleDateString('vi-VN', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              <Text style={styles.selectedDateCount}>{selectedPhotos.length} ảnh</Text>
            </View>
            <FlatList
              data={selectedPhotos}
              renderItem={renderPhoto}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
            />
          </View>
        )}

        {selectedDate && selectedPhotos.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có ảnh trong ngày này</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  monthButton: {
    padding: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  weekdayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH + 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  selectedDay: {
    backgroundColor: '#2563eb',
  },
  todayCell: {
    backgroundColor: '#dbeafe',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  todayText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  photoThumbnailContainer: {
    width: DAY_WIDTH - 6,
    height: DAY_WIDTH - 6,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  photoCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedDateSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  selectedDateHeader: {
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  selectedDateCount: {
    fontSize: 14,
    color: '#666',
  },
  grid: {
    paddingTop: 8,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  photoImage: {
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
    marginTop: 12,
  },
});
