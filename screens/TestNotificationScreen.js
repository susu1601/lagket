import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { typography } from "../styles/typography";
import { semanticSpacing, borderRadius, shadows } from "../styles/spacing";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  sendNotification,
  NOTIFICATION_TYPES
} from "../services/notificationService";

export default function TestNotificationScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sending, setSending] = useState(false);

  const sendTestNotification = async (type) => {
    try {
      setSending(true);
      
      let notification = {};
      
      switch (type) {
        case "photo":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.NEW_PHOTO,
            title: "Test: Ảnh mới",
            message: "Đây là thông báo test về ảnh mới",
            data: {
              photoId: "test_photo_123",
              photoUrl: "https://picsum.photos/200",
              caption: "Test photo caption"
            }
          };
          break;
          
        case "friend_request":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.FRIEND_REQUEST,
            title: "Test: Lời mời kết bạn",
            message: "Đây là thông báo test về lời mời kết bạn",
            data: {}
          };
          break;
          
        case "friend_accepted":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.FRIEND_ACCEPTED,
            title: "Test: Chấp nhận kết bạn",
            message: "Đây là thông báo test về chấp nhận kết bạn",
            data: {}
          };
          break;
          
        case "family_invitation":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.FAMILY_INVITATION,
            title: "Test: Lời mời gia đình",
            message: "Đây là thông báo test về lời mời gia đình",
            data: {
              familyId: "test_family_123",
              familyName: "Gia đình Test"
            }
          };
          break;
          
        case "family_accepted":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.FAMILY_ACCEPTED,
            title: "Test: Chấp nhận gia đình",
            message: "Đây là thông báo test về chấp nhận lời mời gia đình",
            data: {
              familyName: "Gia đình Test"
            }
          };
          break;
          
        case "family_declined":
          notification = {
            senderId: user.uid,
            senderName: user.displayName || user.email,
            senderAvatar: null,
            type: NOTIFICATION_TYPES.FAMILY_DECLINED,
            title: "Test: Từ chối gia đình",
            message: "Đây là thông báo test về từ chối lời mời gia đình",
            data: {
              familyName: "Gia đình Test"
            }
          };
          break;
      }
      
      await sendNotification(user.uid, notification);
      
      Alert.alert(
        "Thành công",
        "Đã gửi thông báo test! Kiểm tra màn hình thông báo và điện thoại của bạn."
      );
    } catch (error) {
      Alert.alert("Lỗi", error.message || "Không thể gửi thông báo test");
      console.error("Error sending test notification:", error);
    } finally {
      setSending(false);
    }
  };

  const testButtons = [
    {
      title: "Test Ảnh Mới",
      subtitle: "Thông báo ảnh mới",
      icon: "camera",
      color: theme.colors.primary,
      type: "photo"
    },
    {
      title: "Test Lời Mời Bạn",
      subtitle: "Thông báo kết bạn",
      icon: "person-add",
      color: theme.colors.success,
      type: "friend_request"
    },
    {
      title: "Test Chấp Nhận Bạn",
      subtitle: "Thông báo chấp nhận",
      icon: "checkmark-circle",
      color: theme.colors.success,
      type: "friend_accepted"
    },
    {
      title: "Test Lời Mời Gia Đình",
      subtitle: "Thông báo gia đình",
      icon: "people",
      color: "#9333EA",
      type: "family_invitation"
    },
    {
      title: "Test Chấp Nhận GĐ",
      subtitle: "Chấp nhận gia đình",
      icon: "checkmark-done-circle",
      color: theme.colors.success,
      type: "family_accepted"
    },
    {
      title: "Test Từ Chối GĐ",
      subtitle: "Từ chối gia đình",
      icon: "close-circle",
      color: theme.colors.error,
      type: "family_declined"
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Test Thông Báo
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle" size={32} color={theme.colors.info} />
          </View>
          <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
            Hướng dẫn
          </Text>
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Nhấn vào các nút bên dưới để gửi thông báo test cho chính bạn. 
            Thông báo sẽ xuất hiện trong màn hình Thông Báo và gửi push notification đến điện thoại.
          </Text>
        </Card>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Các loại thông báo
          </Text>
          <View style={styles.buttonsGrid}>
            {testButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.testButton, { backgroundColor: theme.colors.neutral[0] }]}
                onPress={() => sendTestNotification(button.type)}
                disabled={sending}
                activeOpacity={0.7}
              >
                <View style={[styles.buttonIcon, { backgroundColor: button.color + "20" }]}>
                  <Ionicons name={button.icon} size={28} color={button.color} />
                </View>
                <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>
                  {button.title}
                </Text>
                <Text style={[styles.buttonSubtitle, { color: theme.colors.textSecondary }]}>
                  {button.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Button
            title="Xem Thông Báo"
            onPress={() => navigation.navigate("Notifications")}
            icon="notifications"
            style={styles.viewButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: semanticSpacing.screen,
    paddingVertical: semanticSpacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...typography.h4,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: semanticSpacing.screen,
    paddingBottom: semanticSpacing["2xl"],
  },
  infoCard: {
    padding: semanticSpacing.lg,
    alignItems: "center",
    marginBottom: semanticSpacing.xl,
  },
  infoIconContainer: {
    marginBottom: semanticSpacing.md,
  },
  infoTitle: {
    ...typography.h5,
    marginBottom: semanticSpacing.sm,
  },
  infoText: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginBottom: semanticSpacing.xl,
  },
  sectionTitle: {
    ...typography.h5,
    marginBottom: semanticSpacing.lg,
  },
  buttonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: semanticSpacing.md,
  },
  testButton: {
    width: "47%",
    padding: semanticSpacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    ...shadows.md,
  },
  buttonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: semanticSpacing.md,
  },
  buttonTitle: {
    ...typography.label,
    marginBottom: semanticSpacing.xs,
    textAlign: "center",
  },
  buttonSubtitle: {
    ...typography.caption,
    textAlign: "center",
  },
  viewButton: {
    marginTop: semanticSpacing.md,
  },
});
