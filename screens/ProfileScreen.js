import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API, { uploadImage } from "../api";

export default function ProfileScreen({ user, onBack, onUpdateUser }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [profilePhoto, setProfilePhoto] = useState(user.profile_photo || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    // This function is no longer needed, keeping for compatibility
    pickImageWithCrop(false);
  };

  const pickImageWithCrop = async (allowEditing) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: allowEditing,
        aspect: [1, 1],
        quality: 0.8,
        // Note: Background color cannot be customized in Expo ImagePicker
        // The crop UI uses system default colors
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: `profile_${Date.now()}.jpg`
          });

          const response = await API.post('/upload/image/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          setProfilePhoto(response.data.url);
          Alert.alert("✓ Success", "Profile photo uploaded!");
        } catch (err) {
          console.error("Upload error:", err);
          Alert.alert("Error", "Failed to upload photo.");
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to open image picker.");
    }
  };

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert("Required", "Please fill all fields");
      return;
    }

    setSaving(true);
    try {
      const response = await API.put(`/app/profile/${user.id}/`, {
        username: username.trim(),
        email: email.trim(),
        profile_photo: profilePhoto,
      });

      Alert.alert("Success", "Profile updated successfully!");
      onUpdateUser(response.data);
      onBack();
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", err.response?.data?.error || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.placeholderText}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </View>
          
        {/* Photo Upload Buttons */}
        <View style={styles.uploadButtonsContainer}>
          <TouchableOpacity 
            style={[styles.uploadOptionButton, styles.uploadOptionPrimary]}
            onPress={() => pickImageWithCrop(false)}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadOptionIcon}>📷</Text>
            <Text style={styles.uploadOptionText}>Select Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadOptionButton, styles.uploadOptionSecondary]}
            onPress={() => pickImageWithCrop(true)}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadOptionIcon}>✂️</Text>
            <Text style={styles.uploadOptionText}>Select & Crop</Text>
          </TouchableOpacity>
        </View>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#a0aec0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor="#a0aec0"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.is_admin ? "👑 Admin" : "👤 User"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (saving || uploading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || uploading}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  header: {
    backgroundColor: "#4299e1",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#4299e1",
  },
  profilePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#4299e1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#3182ce",
  },
  placeholderText: {
    fontSize: 56,
    fontWeight: "800",
    color: "#fff",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoButton: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  uploadButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadOptionPrimary: {
    backgroundColor: "#4299e1",
  },
  uploadOptionSecondary: {
    backgroundColor: "#805ad5",
  },
  uploadOptionIcon: {
    fontSize: 20,
  },
  uploadOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: "#1a202c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3748",
    letterSpacing: 0.3,
  },
  roleBadge: {
    backgroundColor: "#edf2f7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4a5568",
    letterSpacing: 0.3,
  },
  saveButton: {
    backgroundColor: "#48bb78",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: "#a0aec0",
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
