// Utility functions for date formatting

export function getRelativeTime(timestamp) {
  if (!timestamp) return 'Chưa rõ';
  
  let date;
  
  // Handle Firestore Timestamp object
  if (timestamp.seconds !== undefined) {
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
  } 
  // Handle object with toDate method
  else if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  }
  // Handle regular date string or number
  else {
    date = new Date(timestamp);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', timestamp);
    return 'Chưa rõ';
  }
  
  // Get current time
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffMs = now.getTime() - date.getTime();
  
  // If time is in the future (with 5 second tolerance for clock skew), return "Vừa xong"
  if (diffMs < -5000) {
    return 'Vừa xong';
  }
  
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'Vừa xong';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} tuần trước`;
  } else if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  } else {
    return `${diffYears} năm trước`;
  }
}

export function formatDate(dateString) {
  if (!dateString) return 'Chưa rõ';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return 'Chưa rõ';
  
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getDaysSince(dateString) {
  if (!dateString) return 0;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
