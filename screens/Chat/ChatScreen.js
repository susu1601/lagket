import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from "../../context/AuthContext";
import { navigateToPhotoDetail } from "../../utils/navigationHelper";
import { subscribeToMessages, sendMessage, sendImageMessage, markMessagesAsRead, deleteAllMessages } from '../../services/chatService';
import { uploadAvatar } from '../../services/authService';
import { getRelativeTime } from '../../utils/dateUtils';

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUser } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = subscribeToMessages(chatId, (updatedMessages) => {
      // Remove duplicates by ID
      const uniqueMessages = updatedMessages.filter((msg, index, self) => 
        index === self.findIndex((m) => m.id === msg.id)
      );
      
      // Sort messages by timestamp before setting state
      const sortedMessages = [...uniqueMessages].sort((a, b) => {
        // Handle Firestore Timestamp objects
        const getTime = (msg) => {
          const ts = msg.timestamp || msg.createdAt;
          if (!ts) return 0;
          
          // If it's a Firestore Timestamp object
          if (ts.seconds !== undefined) {
            return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
          }
          
          // If it has toDate method
          if (typeof ts.toDate === 'function') {
            return ts.toDate().getTime();
          }
          
          // If it's already a date or timestamp
          return new Date(ts).getTime();
        };
        
        return getTime(a) - getTime(b);
      });
      
      setMessages(sortedMessages);
      setLoading(false);
      
      // Mark messages as read
      markMessagesAsRead(chatId, user.uid);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // Send message to server - subscribeToMessages will update UI automatically
      await sendMessage(chatId, user.uid, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSending(true);
        
        try {
          const asset = result.assets[0];
          const uri = asset.uri;
          
          // Upload image to Cloudinary
          const uploadResult = await uploadAvatar(uri, user.uid);
          
          // Extract the secure URL from the upload result
          const imageUrlString = uploadResult.secureUrl || uploadResult.secure_url;
          
          if (!imageUrlString) {
            throw new Error('Không nhận được URL ảnh từ Cloudinary');
          }
          
          console.log('Image URL:', imageUrlString);
          
          // Send image message - subscribeToMessages will update UI automatically
          await sendImageMessage(chatId, user.uid, imageUrlString);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
          setSending(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh');
      setSending(false);
    }
  };

  const renderMessage = ({ item: message }) => {
    // IMPORTANT: Check if this message is from the current user
    const isMyMessage = message.senderId === user.uid;
    
    // Get image URL as string
    const imageUrl = message.imageUrl ? String(message.imageUrl).trim() : null;
    const hasValidImage = message.type === 'image' && imageUrl && imageUrl.length > 0;

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {hasValidImage && (
          <TouchableOpacity 
            onPress={() => navigateToPhotoDetail(navigation, { 
              cloudinaryUrl: imageUrl 
            }, user)}
            activeOpacity={0.8}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.messageImage}
              resizeMode="cover"
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
                console.log('Image URL:', imageUrl);
              }}
              onLoad={() => console.log('Image loaded successfully:', imageUrl)}
            />
          </TouchableOpacity>
        )}
        
        {message.text && String(message.text).trim().length > 0 && (
          <View style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
          ]}>
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText
            ]}>
              {message.text}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageFooter,
          isMyMessage ? styles.myMessageFooter : styles.otherMessageFooter
        ]}>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {getRelativeTime(message.timestamp || message.createdAt)}
          </Text>
          {isMyMessage && (
            <Text style={styles.readStatus}>
              {message.read ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#54b6f8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {otherUser.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          <Text style={styles.headerTitle}>{otherUser.name || 'Người dùng'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Xóa toàn bộ tin nhắn',
              'Bạn có chắc muốn xóa toàn bộ tin nhắn trong cuộc trò chuyện này?',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xóa',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAllMessages(chatId);
                      Alert.alert('Thành công', 'Đã xóa toàn bộ tin nhắn');
                    } catch (error) {
                      Alert.alert('Lỗi', 'Không thể xóa tin nhắn');
                    }
                  }
                }
              ]
            );
          }}>
          <Ionicons name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item.id || `msg-${index}`}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        extraData={messages}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có tin nhắn</Text>
            <Text style={styles.emptySubtext}>Gửi tin nhắn đầu tiên!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.imageButton}
          onPress={handlePickImage}
          disabled={sending}>
          <Ionicons name="image" size={24} color="#54b6f8" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!sending}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#54b6f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  myMessageBubble: {
    backgroundColor: '#ffcc00', // Locket yellow accent
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#222',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#000', // Black text on yellow background
  },
  otherMessageText: {
    color: '#fff', // White text on dark gray background
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myMessageFooter: {
    justifyContent: 'flex-end',
  },
  otherMessageFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  myMessageTime: {
    textAlign: 'right',
  },
  otherMessageTime: {
    textAlign: 'left',
  },
  readStatus: {
    fontSize: 11,
    color: '#ffcc00',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(84, 182, 248, 0.1)',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#222', // Darker gray for input
    color: '#fff',
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffcc00',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ccc',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
  },
});
