/**
 * Test Component for Firebase User Search
 * 
 * Component này để test chức năng tìm kiếm users trên Firebase
 * Có thể thêm vào app để debug và test
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { searchUsersByQuery } from '../services/authService';

export default function SearchUsersTest() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTime, setSearchTime] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const users = await searchUsersByQuery(query, 20);
      const endTime = Date.now();
      
      setResults(users);
      setSearchTime(endTime - startTime);
      
      console.log(`Search completed in ${endTime - startTime}ms`);
      console.log(`Found ${users.length} users`);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <Text style={styles.displayName}>{item.displayName}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.uid}>UID: {item.uid}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase User Search Test</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên hoặc email..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.searchButtonText}>Tìm</Text>
          )}
        </TouchableOpacity>
      </View>

      {searchTime > 0 && (
        <Text style={styles.info}>
          Tìm thấy {results.length} kết quả trong {searchTime}ms
        </Text>
      )}

      {error && (
        <Text style={styles.error}>Lỗi: {error}</Text>
      )}

      <FlatList
        data={results}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        style={styles.list}
        ListEmptyComponent={() => (
          !loading && query && (
            <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
          )
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    marginRight: 10,
  },
  searchButton: {
    width: 80,
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  userItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  uid: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
