// Helper function to navigate to the correct photo detail screen
export const navigateToPhotoDetail = (navigation, photo, currentUser) => {
  if (!photo || !currentUser) {
    console.warn('Missing photo or user data for navigation');
    return;
  }

  // Nếu ảnh không có userId, mặc định coi là ảnh của mình
  const isOwnPhoto = !photo.userId || currentUser.uid === photo.userId;
  const screenName = isOwnPhoto ? 'MyPhotoDetail' : 'OtherPhotoDetail';
  
  console.log('NavigationHelper Debug:', {
    photoId: photo?.id,
    photoUserId: photo?.userId,
    currentUserId: currentUser?.uid,
    isOwnPhoto,
    screenName
  });
  
  navigation.navigate(screenName, { photo });
};
