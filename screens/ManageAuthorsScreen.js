import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Image, ScrollView, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import API from "../api";

export default function ManageAuthorsScreen({ user, onBack, onAuthorAdded }) {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  
  // Form fields
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const res = await API.get("/authors/");
      setAuthors(res.data);
    } catch (err) {
      console.error("Error fetching authors:", err);
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: `author_${Date.now()}.jpg`
        });

        const response = await API.post("/upload/image/", formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        setPhotoUrl(response.data.url);
        Alert.alert("✓ Success", "Photo uploaded!");
      } catch (err) {
        Alert.alert("Error", "Failed to upload photo.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter author name");
      return;
    }

    setSaving(true);
    try {
      const authorData = {
        user_id: user.id,
        name: name.trim(),
        bio: bio.trim(),
        photo_url: photoUrl || null,
      };

      if (editingAuthor) {
        await API.put(`/authors/${editingAuthor.id}/`, authorData);
        Alert.alert("Success", "Author updated successfully");
      } else {
        await API.post("/authors/", authorData);
        Alert.alert("Success", "Author added successfully");
        if (onAuthorAdded) onAuthorAdded(); // Notify parent
      }
      
      resetForm();
      fetchAuthors();
    } catch (err) {
      console.error("Error saving author:", err);
      Alert.alert("Error", "Failed to save author");
    } finally {
      setSaving(false);
    }
  };

  const editAuthor = (author) => {
    setEditingAuthor(author);
    setName(author.name);
    setBio(author.bio || "");
    setPhotoUrl(author.photo_url || "");
    setShowForm(true);
  };

  const deleteAuthor = async (authorId) => {
    Alert.alert(
      "Delete Author",
      "Are you sure? Books by this author will remain but won't show author info.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/authors/${authorId}/`, {
                data: { user_id: user.id }
              });
              Alert.alert("Success", "Author deleted");
              fetchAuthors();
            } catch (err) {
              Alert.alert("Error", "Failed to delete author");
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setName("");
    setBio("");
    setPhotoUrl("");
    setEditingAuthor(null);
    setShowForm(false);
  };

  const renderAuthor = ({ item }) => (
    <View style={styles.authorCard}>
      <View style={styles.authorInfo}>
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.authorPhoto} />
        ) : (
          <View style={styles.authorPhotoPlaceholder}>
            <Text style={styles.authorPhotoText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.authorDetails}>
          <Text style={styles.authorName}>{item.name}</Text>
          {item.bio && (
            <Text style={styles.authorBio} numberOfLines={2}>{item.bio}</Text>
          )}
        </View>
      </View>
      <View style={styles.authorActions}>
        <TouchableOpacity 
          style={styles.editBtn}
          onPress={() => editAuthor(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => deleteAuthor(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Authors</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} activeOpacity={0.7}>
          <Text style={styles.addButton}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={styles.formContainer}>
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingAuthor ? "Edit Author" : "Add New Author"}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter author name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter author bio"
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author Photo</Text>
              {photoUrl ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photoUrl }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.changePhotoBtn}
                    onPress={pickPhoto}
                    disabled={uploading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changePhotoBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadBtn}
                  onPress={pickPhoto}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadBtnText}>
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving..." : editingAuthor ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading authors...</Text>
        </View>
      ) : !showForm ? (
        <FlatList
          data={authors}
          renderItem={renderAuthor}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyText}>No authors yet</Text>
              <Text style={styles.emptySubtext}>Add your first author to get started</Text>
            </View>
          }
        />
      ) : null}
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
    padding: 20,
    paddingTop: 50,
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  addButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  form: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f7fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a202c",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  photoPreview: {
    alignItems: "center",
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  changePhotoBtn: {
    backgroundColor: "#edf2f7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changePhotoBtnText: {
    color: "#4299e1",
    fontWeight: "700",
  },
  uploadBtn: {
    backgroundColor: "#f7fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadBtnText: {
    color: "#4a5568",
    fontWeight: "600",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#edf2f7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#4a5568",
    fontWeight: "700",
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#48bb78",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#718096",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  authorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  authorInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  authorPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  authorPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4299e1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  authorPhotoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  authorDetails: {
    flex: 1,
    justifyContent: "center",
  },
  authorName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 4,
  },
  authorBio: {
    fontSize: 14,
    color: "#718096",
  },
  authorActions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: "#4299e1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#f56565",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4a5568",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#a0aec0",
  },
});
