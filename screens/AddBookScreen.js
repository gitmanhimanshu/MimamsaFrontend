import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Animated, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Constants from "expo-constants";
import API from "../api";

export default function AddBookScreen({ user, onBack, onNavigate, book = null }) {
  const [title, setTitle] = useState(book?.title || "");
  const [description, setDescription] = useState(book?.description || "");
  const [authorId, setAuthorId] = useState(book?.author || "");
  const [categoryId, setCategoryId] = useState(book?.category || "");
  const [genre, setGenre] = useState(book?.genre || "");
  const [fileType, setFileType] = useState(book?.file_type || "pdf");
  const [language, setLanguage] = useState(book?.language || "Hindi");
  const [isPaid, setIsPaid] = useState(book?.is_paid || false);
  const [price, setPrice] = useState(book?.price?.toString() || "");
  const [publishedYear, setPublishedYear] = useState(book?.published_year?.toString() || "");
  const [coverImageUrl, setCoverImageUrl] = useState(book?.cover_image_url || "");
  const [contentUrl, setContentUrl] = useState(book?.content_url || "");
  
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress] = useState(new Animated.Value(0));
  const [spinValue] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  const fileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'epub', label: 'EPUB' },
    { value: 'mobi', label: 'MOBI' },
    { value: 'txt', label: 'Text' },
    { value: 'other', label: 'Other' },
  ];
  const [scaleAnim] = useState(new Animated.Value(1));

  const CLOUDINARY_CLOUD_NAME = Constants.expoConfig?.extra?.CLOUDINARY_CLOUD_NAME || "dbizsbr3w";
  const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig?.extra?.CLOUDINARY_UPLOAD_PRESET || "punch_data";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [authorsRes, categoriesRes, genresRes] = await Promise.all([
        API.get("/authors/"),
        API.get("/categories/"),
        API.get("/genres/")
      ]);
      setAuthors(authorsRes.data);
      setCategories(categoriesRes.data);
      setGenres(genresRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const animateProgress = () => {
    // Reset animations
    uploadProgress.setValue(0);
    spinValue.setValue(0);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Progress bar animation
    Animated.timing(uploadProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const uploadToCloudinary = async (uri, resourceType = "image") => {
    const formData = new FormData();
    const fileType = resourceType === "image" ? "image/jpeg" : 
                     uri.endsWith('.pdf') ? "application/pdf" : 
                     uri.endsWith('.epub') ? "application/epub+zip" : 
                     "text/plain";
    const fileName = resourceType === "image" ? `cover_${Date.now()}.jpg` : 
                     `book_${Date.now()}.${uri.split('.').pop()}`;
    
    formData.append("file", {
      uri,
      type: fileType,
      name: fileName
    });

    try {
      // Use backend endpoints for secure upload
      const endpoint = resourceType === "image" ? "/upload/image/" : 
                       uri.endsWith('.txt') ? "/upload/text/" : 
                       "/upload/pdf/";
      
      const response = await API.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      setUploadingType("image");
      animateProgress();
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, "image");
        setCoverImageUrl(url);
        Alert.alert("✓ Success", "Cover image uploaded!");
      } catch (err) {
        Alert.alert("Error", "Failed to upload image.");
      } finally {
        setUploading(false);
        setUploadingType("");
      }
    }
  };

  const pickContentFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/epub+zip", "*/*"],
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setUploading(true);
      setUploadingType("content");
      animateProgress();
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, "raw");
        setContentUrl(url);
        Alert.alert("✓ Success", "Content file uploaded!");
      } catch (err) {
        Alert.alert("Error", "Failed to upload file.");
      } finally {
        setUploading(false);
        setUploadingType("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!title || title.trim() === "") {
      Alert.alert("Required", "Please enter a book title");
      return;
    }

    setLoading(true);
    try {
      const bookData = {
        user_id: user.id,
        title: title.trim(),
        description: description || "",
        author: authorId || null,
        category: categoryId || null,
        genre: genre || null,
        file_type: fileType || "pdf",
        cover_image_url: coverImageUrl || "",
        content_url: contentUrl || "",
        language: language || "Hindi",
        is_paid: isPaid,
        price: isPaid && price ? parseFloat(price) : null,
        published_year: publishedYear ? parseInt(publishedYear) : null,
      };

      if (book) {
        await API.put(`/books/${book.id}/`, bookData);
        Alert.alert("Success", "Book updated successfully");
      } else {
        await API.post("/books/", bookData);
        Alert.alert("Success", "Book added successfully");
      }
      onBack();
    } catch (err) {
      console.error("Error saving book:", err);
      Alert.alert("Error", "Failed to save book");
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = uploadProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{book ? "Edit Book" : "Add New Book"}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Book Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter book title"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter book description"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Author</Text>
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate("ManageAuthors");
                  } else {
                    Alert.alert("Info", "Navigation not available. Please use Admin Panel to manage authors.");
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.addNewButtonText}>+ Add New</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={authorId}
                onValueChange={(value) => setAuthorId(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Author" value="" />
                {authors.map((author) => (
                  <Picker.Item key={author.id} label={author.name} value={author.id} />
                ))}
              </Picker>
            </View>
          </View>

          {categories.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={categoryId}
                  onValueChange={(value) => setCategoryId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Category" value="" />
                  {categories.map((category) => (
                    <Picker.Item key={category.id} label={category.name} value={category.id} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {genres.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Genre</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={genre}
                  onValueChange={(value) => setGenre(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Genre" value="" />
                  {genres.map((g) => (
                    <Picker.Item key={g.value} label={g.label} value={g.value} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>File Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fileType}
                onValueChange={(value) => setFileType(value)}
                style={styles.picker}
              >
                {fileTypes.map((ft) => (
                  <Picker.Item key={ft.value} label={ft.label} value={ft.value} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Language</Text>
              <TextInput
                style={styles.input}
                value={language}
                onChangeText={setLanguage}
                placeholder="Hindi"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={publishedYear}
                onChangeText={setPublishedYear}
                placeholder="2024"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Is this a paid book?</Text>
            <TouchableOpacity
              style={[styles.switchButton, isPaid && styles.switchButtonActive]}
              onPress={() => setIsPaid(!isPaid)}
              activeOpacity={0.8}
            >
              <Text style={styles.switchButtonText}>{isPaid ? "Yes" : "No"}</Text>
            </TouchableOpacity>
          </View>

          {isPaid && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.uploadSection}>
            <Text style={styles.sectionTitle}>Media Files</Text>
            
            <View style={styles.uploadCard}>
              <Text style={styles.uploadLabel}>Cover Image</Text>
              {coverImageUrl ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: coverImageUrl }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={pickCoverImage} 
                    disabled={uploading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changeButtonText}>Change Image</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickCoverImage} 
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadIcon}>📷</Text>
                  <Text style={styles.uploadButtonText}>Upload Cover Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.uploadCard}>
              <Text style={styles.uploadLabel}>Content File (PDF, EPUB, etc.)</Text>
              {contentUrl ? (
                <View style={styles.uploadedContainer}>
                  <Text style={styles.uploadedIcon}>✓</Text>
                  <Text style={styles.uploadedText}>File Uploaded</Text>
                  <TouchableOpacity 
                    style={styles.changeButton}
                    onPress={pickContentFile} 
                    disabled={uploading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changeButtonText}>Change File</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={pickContentFile} 
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.uploadIcon}>📚</Text>
                  <Text style={styles.uploadButtonText}>Upload eBook/Content</Text>
                  <Text style={styles.uploadHint}>PDF, EPUB, or any format</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {uploading && (
            <Animated.View 
              style={[
                styles.uploadingContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Text style={styles.uploadingIcon}>⏳</Text>
              </Animated.View>
              <Text style={styles.uploadingText}>
                Uploading {uploadingType === "image" ? "image" : "content file"} to Cloudinary...
              </Text>
              <Text style={styles.uploadingSubtext}>Please wait, this may take a moment</Text>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressText}>
                {uploadingType === "image" ? "📷 Uploading Image..." : "📚 Uploading Content..."}
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, (loading || uploading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || uploading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {book ? "Update Book" : "Add Book"}
              </Text>
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
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#007bff",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  addNewButton: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addNewButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  chip: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: "#007bff",
  },
  chipText: {
    color: "#495057",
    fontSize: 14,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  switchButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  switchButtonActive: {
    backgroundColor: "#28a745",
  },
  switchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  uploadSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  uploadLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#007bff",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 30,
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadHint: {
    color: "#6c757d",
    fontSize: 12,
    marginTop: 5,
  },
  previewContainer: {
    alignItems: "center",
  },
  imagePreview: {
    width: 150,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  uploadedContainer: {
    alignItems: "center",
    padding: 20,
  },
  uploadedIcon: {
    fontSize: 50,
    color: "#28a745",
    marginBottom: 10,
  },
  uploadedText: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "600",
    marginBottom: 15,
  },
  changeButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  uploadingContainer: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "#e3f2fd",
  },
  uploadingIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  uploadingText: {
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
    fontSize: 17,
    fontWeight: "600",
  },
  uploadingSubtext: {
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
  },
  progressBar: {
    width: "100%",
    height: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  progressText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
