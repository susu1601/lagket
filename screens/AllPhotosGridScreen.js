import React, { useEffect, useState, useContext, useCallback, useRef, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Image,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import SafeImage from "../components/SafeImage";
import { AuthContext } from "../context/AuthContext";
import { getUserAlbum, getFriendsRecentPhotos } from "../services/userAlbumService";
import { addReaction, removeReaction, getReactions, EMOJI_LIST } from "../services/reactionService";
import { getOrCreateChat, sendMessage, sendImageMessage } from "../services/chatService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function getTimeAgo(dateValue) {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin}p`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}g`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d`;
}

function PhotoPageCard({ item, currentUser, navigation, keyboardVisible, onInputFocus, onInputBlur }) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [myReaction, setMyReaction] = useState(null);
    const [reactionCount, setReactionCount] = useState(0);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const isOwn = !item.userId || item.userId === currentUser?.uid;
    const imageUri = item.cloudinaryUrl || item.uri || item.localUri;
    const ownerLabel = isOwn ? "Bạn" : (item.userName || "Bạn bè");
    const avatarUri = (isOwn ? currentUser?.avatar : null) || item.userAvatar || item.senderAvatar || item.avatar || null;
    const timeAgo = getTimeAgo(item.createdAt);
    const caption = item.caption || item.note || "";

    useEffect(() => {
        const loadReaction = async () => {
            if (!item?.id || !currentUser?.uid) return;
            try {
                const reactions = await getReactions(item.id);
                setReactionCount(Object.keys(reactions || {}).length);
                if (reactions?.[currentUser.uid]) {
                    setMyReaction(reactions[currentUser.uid].emoji);
                }
            } catch (e) {
                console.warn("loadReaction error:", e?.message || e);
            }
        };

        loadReaction();
    }, [item?.id, currentUser?.uid]);

    const handleReaction = async (emoji) => {
        setShowEmojiPicker(false);
        if (!currentUser?.uid || !item?.id) return;
        try {
            if (myReaction === emoji) {
                await removeReaction(currentUser.uid, item.id);
                setMyReaction(null);
                setReactionCount((prev) => Math.max(0, prev - 1));
            } else {
                await addReaction(
                    currentUser.uid,
                    item.id,
                    emoji,
                    currentUser.displayName || "Bạn",
                    item.userId,
                    {
                        photoUrl: imageUri,
                        caption,
                    }
                );
                setMyReaction(emoji);
                if (!myReaction) setReactionCount((prev) => prev + 1);
            }
        } catch (e) {
            console.error("Reaction error:", e);
        }
    };

    const handleSendReply = async () => {
        if (isOwn || !replyText.trim() || !currentUser?.uid || !item.userId || sendingReply) return;
        setSendingReply(true);
        try {
            const chat = await getOrCreateChat(currentUser.uid, item.userId);
            if (imageUri) {
                await sendImageMessage(chat.id, currentUser.uid, imageUri, replyText.trim());
            } else {
                await sendMessage(chat.id, currentUser.uid, replyText.trim());
            }
            setReplyText("");
            Alert.alert("Đã gửi", "Tin nhắn đã được gửi thành công");
        } catch (e) {
            console.error("Reply error:", e);
            Alert.alert("Lỗi", "Không thể gửi tin nhắn");
        } finally {
            setSendingReply(false);
        }
    };

    return (
        <View style={[styles.pageWrap, keyboardVisible && styles.pageWrapKeyboard]}>
            <TouchableOpacity
                style={[styles.photoCard, keyboardVisible && styles.photoCardKeyboard]}
                activeOpacity={0.95}
                onPress={() => {
                    if (item.isOwn) {
                        navigation.navigate("MyPhotoDetail", { photo: item });
                    } else {
                        navigation.navigate("OtherPhotoDetail", { photo: item });
                    }
                }}
            >
                <SafeImage source={{ uri: imageUri }} style={styles.photoCardImage} resizeMode="cover" />
                {timeAgo ? (
                    <View style={styles.photoTimeBadge}>
                        <Text style={styles.photoTimeBadgeText}>{timeAgo}</Text>
                    </View>
                ) : null}
            </TouchableOpacity>

            <View style={styles.metaRow}>
                {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Ionicons name={isOwn ? "person" : "people"} size={14} color="#fff" />
                    </View>
                )}
                <Text style={styles.metaName}>{ownerLabel}</Text>
            </View>

            {caption ? (
                <Text style={styles.captionText} numberOfLines={2}>{caption}</Text>
            ) : null}

            {!isOwn && (
                <View style={styles.replyPanel}>
                    <View style={styles.replyInputRow}>
                        <TextInput
                            style={styles.replyInput}
                            placeholder="Gửi tin nhắn..."
                            placeholderTextColor="#9f9f9f"
                            value={replyText}
                            onChangeText={setReplyText}
                            onFocus={() => onInputFocus?.(item.id)}
                            onBlur={() => onInputBlur?.()}
                            editable={!sendingReply}
                            maxLength={200}
                            returnKeyType="send"
                            onSubmitEditing={handleSendReply}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!replyText.trim() || sendingReply) && styles.sendBtnDisabled]}
                            onPress={handleSendReply}
                            disabled={!replyText.trim() || sendingReply}
                        >
                            {sendingReply ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="send" size={16} color="#fff" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.moreEmojiBtn}
                            onPress={() => setShowEmojiPicker((prev) => !prev)}
                        >
                            <Ionicons name="happy-outline" size={20} color="#d8d8d8" />
                        </TouchableOpacity>
                    </View>

                    {showEmojiPicker && (
                        <View style={styles.emojiPickerRow}>
                            {EMOJI_LIST.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[styles.emojiPickerBtn, myReaction === emoji && styles.emojiPickerBtnActive]}
                                    onPress={() => handleReaction(emoji)}
                                >
                                    <Text style={styles.emojiPickerText}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {isOwn && (
                <View style={styles.replyPanel}>
                    <Text style={styles.ownReactionText}>{reactionCount} cảm xúc</Text>
                </View>
            )}
        </View>
    );
}

export default function AllPhotosGridScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("all"); // "all" | "mine" | `friend:${id}`
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState("feed"); // "feed" | "grid"
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [focusedInputPhotoId, setFocusedInputPhotoId] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, () => {
            setKeyboardVisible(true);
            setIsFilterOpen(false);
        });

        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardVisible(false);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const loadPhotos = useCallback(async () => {
        try {
            if (!user?.uid) return;

            const [albumData, friendPhotos] = await Promise.all([
                getUserAlbum(user.uid, 100),
                getFriendsRecentPhotos(user.uid, 100),
            ]);

            const ownPhotos = albumData.photos.map((p) => ({
                ...p,
                userId: user.uid,
                userName: "Bạn",
                userAvatar: user?.avatar || null,
                isOwn: true,
            }));

            const friends = friendPhotos.map((p) => ({
                ...p,
                userAvatar: p.userAvatar || null,
                isOwn: false,
            }));

            let all = [...ownPhotos, ...friends];

            // Remove duplicates
            const seen = new Set();
            all = all.filter((p) => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
            });

            // Sort newest first
            all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setPhotos(all);
        } catch (error) {
            console.error("Error loading photos:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, user?.avatar]);

    useFocusEffect(
        useCallback(() => {
            loadPhotos();
        }, [loadPhotos])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPhotos();
        setRefreshing(false);
    }, [loadPhotos]);

    const friendFilterOptions = photos
        .filter((p) => !p.isOwn)
        .reduce((acc, photo) => {
            const friendId = photo.userId || photo.senderId || photo.userName;
            const friendName = photo.userName || "Bạn bè";
            if (!friendId) return acc;
            if (!acc.some((f) => f.id === friendId)) {
                acc.push({ id: friendId, name: friendName });
            }
            return acc;
        }, []);

    const filterOptions = [
        { key: "all", label: "Mọi người" },
        { key: "mine", label: "Của bạn" },
        ...friendFilterOptions.map((f) => ({
            key: `friend:${f.id}`,
            label: f.name,
        })),
    ];

    const filteredPhotos = photos.filter((p) => {
        if (selectedFilter === "mine") return p.isOwn;
        if (selectedFilter.startsWith("friend:")) {
            const friendId = selectedFilter.replace("friend:", "");
            return !p.isOwn && String(p.userId || p.senderId || p.userName) === String(friendId);
        }
        return true;
    });

    const photoIndexMap = useMemo(() => {
        const map = new Map();
        filteredPhotos.forEach((p, index) => map.set(p.id, index));
        return map;
    }, [filteredPhotos]);

    useEffect(() => {
        if (!keyboardVisible || !focusedInputPhotoId || viewMode !== "feed") return;
        const index = photoIndexMap.get(focusedInputPhotoId);
        if (index == null || index < 0) return;

        const timer = setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.12,
            });
        }, 80);

        return () => clearTimeout(timer);
    }, [keyboardVisible, focusedInputPhotoId, photoIndexMap, viewMode]);

    const selectedFilterLabel =
        filterOptions.find((option) => option.key === selectedFilter)?.label || "Mọi người";

    const handleSelectFilter = (key) => {
        setSelectedFilter(key);
        setIsFilterOpen(false);
    };

    const goToCamera = () => {
        const parent = navigation.getParent?.();

        // If this screen is inside Camera stack, go directly to CameraMain
        const currentRouteNames = navigation.getState?.()?.routeNames || [];
        if (currentRouteNames.includes("CameraMain")) {
            navigation.navigate("CameraMain");
            return;
        }

        // Switch to Camera tab and open CameraMain
        if (parent) {
            parent.navigate("Camera", { screen: "CameraMain" });
            return;
        }

        navigation.navigate("Camera", { screen: "CameraMain" });
    };

    const handleOpenPhotoDetail = (photo) => {
        if (!photo) return;
        if (photo.isOwn) {
            navigation.navigate("MyPhotoDetail", { photo });
        } else {
            navigation.navigate("OtherPhotoDetail", { photo });
        }
    };

    const renderGridTile = ({ item }) => {
        const imageUri = item.cloudinaryUrl || item.uri || item.localUri;
        const timeAgo = getTimeAgo(item.createdAt);
        return (
            <TouchableOpacity
                style={styles.gridTile}
                activeOpacity={0.9}
                onPress={() => handleOpenPhotoDetail(item)}
            >
                <SafeImage source={{ uri: imageUri }} style={styles.gridTileImage} resizeMode="cover" />
                {timeAgo ? (
                    <View style={styles.gridTimeBadge}>
                        <Text style={styles.gridTimeText}>{timeAgo}</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
            <LinearGradient
                colors={["#111216", "#1b1d23", "#101113"]}
                locations={[0, 0.55, 1]}
                style={styles.bgGradient}
            />

            <View style={styles.topHeader}>
                <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.navigate("Profile")}>
                    <Ionicons name="person-circle-outline" size={30} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.filterPill}
                    activeOpacity={0.85}
                    onPress={() => setIsFilterOpen((prev) => !prev)}
                >
                    <Text style={styles.filterText}>{selectedFilterLabel}</Text>
                    <Ionicons
                        name={isFilterOpen ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#fff"
                        style={{ marginLeft: 6 }}
                    />
                </TouchableOpacity>

                <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.navigate("Friends", { screen: "ChatList" })}>
                    <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {isFilterOpen && (
                <View style={styles.dropdownWrap}>
                    <View style={styles.dropdownMenu}>
                        {filterOptions.map((option) => {
                            const isActive = selectedFilter === option.key;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                                    onPress={() => handleSelectFilter(option.key)}
                                >
                                    <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]} numberOfLines={1}>
                                        {option.label}
                                    </Text>
                                    {isActive && <Ionicons name="checkmark" size={16} color="#ff5fb3" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#ff5fb3" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    key={viewMode}
                    data={filteredPhotos}
                    renderItem={viewMode === "grid"
                        ? renderGridTile
                        : ({ item }) => (
                            <PhotoPageCard
                                item={item}
                                currentUser={user}
                                navigation={navigation}
                                keyboardVisible={keyboardVisible}
                                onInputFocus={(photoId) => setFocusedInputPhotoId(photoId)}
                                onInputBlur={() => setFocusedInputPhotoId(null)}
                            />
                        )
                    }
                    keyExtractor={(item, index) => item.id || `grid-${index}`}
                    numColumns={viewMode === "grid" ? 3 : 1}
                    pagingEnabled={viewMode === "feed" && !keyboardVisible}
                    decelerationRate={viewMode === "feed" ? "fast" : "normal"}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={viewMode === "grid" ? styles.gridListContent : styles.listContent}
                    getItemLayout={viewMode === "feed" ? (_, index) => ({
                        length: SCREEN_HEIGHT,
                        offset: SCREEN_HEIGHT * index,
                        index,
                    }) : undefined}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                            colors={["#ff5fb3"]}
                        />
                    }
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    onScrollToIndexFailed={({ index }) => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToOffset({
                                offset: Math.max(0, index * SCREEN_HEIGHT),
                                animated: true,
                            });
                        }, 120);
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="images-outline" size={48} color="#666" />
                            <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
                        </View>
                    }
                />
            )}

            {!keyboardVisible && (
                <View style={styles.bottomDock}>
                    <TouchableOpacity style={styles.dockIconBtn} onPress={() => setViewMode((prev) => prev === "feed" ? "grid" : "feed")}>
                        <Ionicons name={viewMode === "grid" ? "albums-outline" : "grid-outline"} size={30} color="#f2f2f2" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cameraFab}
                        activeOpacity={0.92}
                        onPress={goToCamera}
                    >
                        <View style={styles.cameraInner} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dockIconBtn}
                        onPress={onRefresh}
                        disabled={refreshing}
                    >
                        {refreshing ? (
                            <ActivityIndicator size="small" color="#f2f2f2" />
                        ) : (
                            <Ionicons name="refresh" size={30} color="#f2f2f2" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#101113",
    },
    bgGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    topHeader: {
        position: "absolute",
        top: 48,
        left: 18,
        right: 18,
        zIndex: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topIconBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "rgba(255,255,255,0.11)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
        alignItems: "center",
        justifyContent: "center",
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.14)",
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        maxWidth: SCREEN_WIDTH * 0.6,
    },
    filterText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    dropdownWrap: {
        position: "absolute",
        top: 112,
        alignSelf: "center",
        zIndex: 30,
    },
    dropdownMenu: {
        backgroundColor: "rgba(16,18,22,0.98)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.13)",
        overflow: "hidden",
        minWidth: 220,
        maxWidth: SCREEN_WIDTH * 0.75,
    },
    dropdownItem: {
        minHeight: 42,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownItemActive: {
        backgroundColor: "rgba(255,95,179,0.20)",
    },
    dropdownItemText: {
        color: "#e4e4e4",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
        marginRight: 12,
    },
    dropdownItemTextActive: {
        color: "#fff",
        fontWeight: "700",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        paddingBottom: 8,
    },
    gridListContent: {
        paddingTop: 124,
        paddingBottom: 140,
        paddingHorizontal: 8,
    },
    gridTile: {
        width: (SCREEN_WIDTH - 28) / 3,
        height: (SCREEN_WIDTH - 28) / 3,
        borderRadius: 18,
        overflow: "hidden",
        margin: 2.5,
        backgroundColor: "#262931",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    gridTileImage: {
        width: "100%",
        height: "100%",
    },
    gridTimeBadge: {
        position: "absolute",
        bottom: 6,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.62)",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    gridTimeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
    },
    pageWrap: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        paddingTop: 128,
        paddingHorizontal: 18,
        paddingBottom: 180,
        justifyContent: "flex-start",
    },
    pageWrapKeyboard: {
        paddingTop: 98,
    },
    photoCard: {
        width: "100%",
        height: SCREEN_HEIGHT * 0.45,
        borderRadius: 28,
        overflow: "hidden",
        backgroundColor: "#252832",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
        elevation: 10,
    },
    photoCardKeyboard: {
        height: SCREEN_HEIGHT * 0.36,
    },
    photoCardImage: {
        width: "100%",
        height: "100%",
    },
    photoTimeBadge: {
        position: "absolute",
        bottom: 18,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.55)",
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },
    photoTimeBadgeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },
    metaRow: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    avatarImage: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginRight: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    avatarFallback: {
        width: 34,
        height: 34,
        borderRadius: 17,
        marginRight: 10,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    metaName: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "800",
        marginRight: 10,
        lineHeight: 38,
    },
    captionText: {
        color: "#eef0f8",
        fontSize: 15,
        marginTop: 7,
        lineHeight: 22,
    },
    replyPanel: {
        marginTop: 14,
    },
    replyInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        borderRadius: 24,
        minHeight: 52,
        paddingHorizontal: 14,
    },
    replyInput: {
        flex: 1,
        color: "#fff",
        fontSize: 17,
        marginRight: 6,
        paddingVertical: 8,
    },
    moreEmojiBtn: {
        marginLeft: 8,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255,255,255,0.14)",
        alignItems: "center",
        justifyContent: "center",
    },
    emojiPickerRow: {
        marginTop: 10,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
    },
    emojiPickerBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    emojiPickerBtnActive: {
        backgroundColor: "rgba(255,95,179,0.45)",
    },
    emojiPickerText: {
        fontSize: 18,
    },
    sendBtn: {
        marginLeft: 6,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#ff5fb3",
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        backgroundColor: "rgba(255,95,179,0.45)",
    },
    ownReactionText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    bottomDock: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 10,
        height: 118,
        borderRadius: 28,
        backgroundColor: "rgba(16,18,22,0.94)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 38,
        zIndex: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.24,
        shadowRadius: 14,
        elevation: 12,
    },
    dockIconBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: "center",
        justifyContent: "center",
    },
    cameraFab: {
        width: 82,
        height: 82,
        borderRadius: 41,
        borderWidth: 6,
        borderColor: "#ff5fb3",
        backgroundColor: "#f6f8fb",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#d8dde3",
    },
    emptyContainer: {
        flex: 1,
        minHeight: SCREEN_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        color: "#999",
        fontSize: 16,
        marginTop: 12,
    },
});