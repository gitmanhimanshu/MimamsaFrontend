import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import API from '../api';

const AddUserPoemScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
    language: 'Hindi',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Use static categories instead of API call
      const staticCategories = [
        { id: 1, name: 'प्रेम कविता', icon: '💕' },
        { id: 2, name: 'प्रकृति', icon: '🌿' },
        { id: 3, name: 'देशभक्ति', icon: '🇮🇳' },
        { id: 4, name: 'आध्यात्मिक', icon: '🕉️' },
        { id: 5, name: 'सामाजिक', icon: '👥' },
        { id: 6, name: 'प्रेरणादायक', icon: '💪' },
        { id: 7, name: 'दुःख', icon: '😢' },
        { id: 8, name: 'हास्य', icon: '😄' }
      ];
      setCategories(staticCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('@user_session');
      const userData = userJson ? JSON.parse(userJson) : {};
      const userId = userData.id;
      
      await API.post('/user-poems/', {
        ...form,
        user_id: userId,
      });

      Alert.alert('Success', 'Your poem has been published!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error submitting poem:', error);
      const errorMsg = error.response?.data?.error || 'Failed to publish poem';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF7700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Your Poem</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter poem title"
            placeholderTextColor="#666"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />

          <Text style={styles.label}>Your Poem *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your poem here..."
            placeholderTextColor="#666"
            value={form.content}
            onChangeText={(text) => setForm({ ...form, content: text })}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Select Category" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Language</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.language}
              onValueChange={(value) => setForm({ ...form, language: value })}
              style={styles.picker}
              dropdownIconColor="#fff"
            >
              <Picker.Item label="Hindi" value="Hindi" />
              <Picker.Item label="English" value="English" />
              <Picker.Item label="Urdu" value="Urdu" />
              <Picker.Item label="Sanskrit" value="Sanskrit" />
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Publish Poem</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            📝 Your poem will be visible to all users once published.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    color: '#3b82f6',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default AddUserPoemScreen;
