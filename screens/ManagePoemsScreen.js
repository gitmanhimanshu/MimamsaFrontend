import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import API from "../api";

export default function ManagePoemsScreen({ user, onBack }) {
  const [poems, setPoems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingPoem, setEditingPoem] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [language, setLanguage] = useState("Hindi");
  
  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("📝");
  const [categoryDescription, setCategoryDescription] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [poemsRes, categoriesRes, authorsRes] = await Promise.all([
        API.get("/poems/"),
        API.get("/poem-categories/"),
        API.get("/authors/")
      ]);
      setPoems(poemsRes.data);
      setCategories(categoriesRes.data);
      setAuthors(authorsRes.data);
    } catch (err) {
      console.error("Error loading data:", err);
      Alert.alert("Error", "Failed to load data");
    }
  };

  const handleAddPoem = () => {
    setEditingPoem(null);
    setTitle("");
    setContent("");
    setSelectedAuthor("");
    setSelectedCategory("");
    setLanguage("Hindi");
    setShowForm(true);
  };

  const handleEditPoem = (poem) => {
    setEditingPoem(poem);
    setTitle(poem.title);
    setContent(poem.content);
    setSelectedAuthor(poem.author?.toString() || "");
    setSelectedCategory(poem.category?.toString() || "");
    setLanguage(poem.language || "Hindi");
    setShowForm(true);
  };

  const handleSavePoem = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content are required");
      return;
    }

    setLoading(true);
    try {
      const poemData = {
        title: title.trim(),
        content: content.trim(),
        author: selectedAuthor || null,
        category: selectedCategory || null,
        language: language,
        user_id: user.id
      };

      if (editingPoem) {
        await API.put(`/poems/${editingPoem.id}/`, poemData);
        Alert.alert("Success", "Poem updated successfully");
      } else {
        await API.post("/poems/", poemData);
        Alert.alert("Success", "Poem added successfully");
      }

      setShowForm(false);
      loadData();
    } catch (err) {
      console.error("Error saving poem:", err);
      Alert.alert("Error", err.response?.data?.error || "Failed to save poem");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoem = (poem) => {
    Alert.alert(
      "Delete Poem",
      `Are you sure you want to delete "${poem.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/poems/${poem.id}/`, {
                data: { user_id: user.id }
              });
              Alert.alert("Success", "Poem deleted");
              loadData();
            } catch (err) {
              Alert.alert("Error", "Failed to delete poem");
            }
          }
        }
      ]
    );
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    setLoading(true);
    try {
      await API.post("/poem-categories/", {
        name: categoryName.trim(),
        icon: categoryIcon,
        description: categoryDescription.trim(),
        user_id: user.id
      });
      Alert.alert("Success", "Category added successfully");
      setShowCategoryForm(false);
      setCategoryName("");
      setCategoryIcon("📝");
      setCategoryDescription("");
      loadData();
    } catch (err) {
      console.error("Error adding category:", err);
      Alert.alert("Error", "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Poems</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddPoem}>
            <Text style={styles.addButtonText}>➕ Add Poem</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, styles.categoryButton]} 
            onPress={() => setShowCategoryForm(true)}
          >
            <Text style={styles.addButtonText}>📁 Add Category</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{poems.length}</Text>
            <Text style={styles.statLabel}>Total Poems</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{categories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* Poems List */}
        <Text style={styles.sectionTitle}>All Poems</Text>
        {poems.map(poem => (
          <View key={poem.id} style={styles.poemCard}>
            <View style={styles.poemCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.poemCardTitle}>{poem.title}</Text>
                <Text style={styles.poemCardMeta}>
                  {poem.author_name && `✍️ ${poem.author_name} • `}
                  {poem.category_icon} {poem.category_name}
                </Text>
              </View>
            </View>
            <Text style={styles.poemCardContent} numberOfLines={3}>
              {poem.content}
            </Text>
            <View style={styles.poemCardActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditPoem(poem)}
              >
                <Text style={styles.editButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeletePoem(poem)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add/Edit Poem Modal */}
      <Modal visible={showForm} animationType="slide" transparent={false}>
        <KeyboardAvoidingView 
          style={styles.fullScreenModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editingPoem ? "✏️ Edit Poem" : "➕ Add New Poem"}
            </Text>
            <TouchableOpacity 
              onPress={handleSavePoem} 
              style={styles.modalSaveButton}
              disabled={loading}
            >
              <Text style={styles.modalSaveText}>
                {loading ? "..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollContent} 
            contentContainerStyle={styles.modalScrollPadding}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>📝 Poem Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter poem title (e.g., मेरी माँ)"
                  placeholderTextColor="#666"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Content * (Full Poem)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={content}
                  onChangeText={setContent}
                  placeholder="Enter poem content here...&#10;&#10;Line 1&#10;Line 2&#10;Line 3..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>👤 Author & Category</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Author</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipScrollContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.pickerChip,
                      !selectedAuthor && styles.pickerChipActive
                    ]}
                    onPress={() => setSelectedAuthor("")}
                  >
                    <Text style={[
                      styles.pickerChipText,
                      !selectedAuthor && styles.pickerChipTextActive
                    ]}>None</Text>
                  </TouchableOpacity>
                  {authors.map(author => (
                    <TouchableOpacity
                      key={author.id}
                      style={[
                        styles.pickerChip,
                        selectedAuthor === author.id.toString() && styles.pickerChipActive
                      ]}
                      onPress={() => setSelectedAuthor(author.id.toString())}
                    >
                      <Text style={[
                        styles.pickerChipText,
                        selectedAuthor === author.id.toString() && styles.pickerChipTextActive
                      ]}>{author.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.chipScroll}
                  contentContainerStyle={styles.chipScrollContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.pickerChip,
                      !selectedCategory && styles.pickerChipActive
                    ]}
                    onPress={() => setSelectedCategory("")}
                  >
                    <Text style={[
                      styles.pickerChipText,
                      !selectedCategory && styles.pickerChipTextActive
                    ]}>None</Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.pickerChip,
                        selectedCategory === cat.id.toString() && styles.pickerChipActive
                      ]}
                      onPress={() => setSelectedCategory(cat.id.toString())}
                    >
                      <Text style={styles.pickerChipIcon}>{cat.icon}</Text>
                      <Text style={[
                        styles.pickerChipText,
                        selectedCategory === cat.id.toString() && styles.pickerChipTextActive
                      ]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Language</Text>
                <View style={styles.languageGrid}>
                  {["Hindi", "English", "Urdu", "Sanskrit"].map(lang => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.languageChip,
                        language === lang && styles.languageChipActive
                      ]}
                      onPress={() => setLanguage(lang)}
                    >
                      <Text style={[
                        styles.languageChipText,
                        language === lang && styles.languageChipTextActive
                      ]}>{lang}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Extra padding at bottom for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showCategoryForm} animationType="slide" transparent={false}>
        <KeyboardAvoidingView 
          style={styles.fullScreenModal}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCategoryForm(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>📁 Add Category</Text>
            <TouchableOpacity 
              onPress={handleAddCategory} 
              style={styles.modalSaveButton}
              disabled={loading}
            >
              <Text style={styles.modalSaveText}>
                {loading ? "..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollContent} 
            contentContainerStyle={styles.modalScrollPadding}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholder="e.g., प्रेम, प्रकृति, देशभक्ति"
                  placeholderTextColor="#666"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Icon (Emoji)</Text>
                <View style={styles.iconSelector}>
                  {["📝", "❤️", "🌸", "🇮🇳", "🌙", "☀️", "🎭", "📖"].map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconChip,
                        categoryIcon === icon && styles.iconChipActive
                      ]}
                      onPress={() => setCategoryIcon(icon)}
                    >
                      <Text style={styles.iconChipText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  value={categoryDescription}
                  onChangeText={setCategoryDescription}
                  placeholder="Optional description"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Extra padding at bottom for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    backgroundColor: "#4299e1",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  categoryButton: {
    backgroundColor: "#48bb78",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    color: "#4299e1",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 5,
  },
  statLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  poemCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  poemCardHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  poemCardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  poemCardMeta: {
    color: "#4299e1",
    fontSize: 13,
  },
  poemCardContent: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  poemCardActions: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#4299e1",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#f56565",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  modalHeader: {
    backgroundColor: "#1a1a1a",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  modalSaveButton: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalScrollContent: {
    flex: 1,
  },
  modalScrollPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 30,
  },
  formSectionTitle: {
    color: "#4299e1",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#2a2a2a",
  },
  textArea: {
    minHeight: 180,
    maxHeight: 300,
    textAlignVertical: "top",
  },
  textAreaSmall: {
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: "top",
  },
  chipScroll: {
    marginBottom: 5,
  },
  chipScrollContent: {
    paddingRight: 20,
  },
  pickerChip: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: "center",
    gap: 5,
    borderWidth: 2,
    borderColor: "#2a2a2a",
  },
  pickerChipActive: {
    backgroundColor: "#4299e1",
    borderColor: "#4299e1",
  },
  pickerChipIcon: {
    fontSize: 16,
  },
  pickerChipText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },
  pickerChipTextActive: {
    color: "#fff",
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  languageChip: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#1a1a1a",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
  },
  languageChipActive: {
    backgroundColor: "#4299e1",
    borderColor: "#4299e1",
  },
  languageChipText: {
    color: "#aaa",
    fontSize: 15,
    fontWeight: "600",
  },
  languageChipTextActive: {
    color: "#fff",
  },
  iconSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  iconChip: {
    backgroundColor: "#1a1a1a",
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2a2a2a",
  },
  iconChipActive: {
    borderColor: "#4299e1",
    backgroundColor: "#2a2a2a",
  },
  iconChipText: {
    fontSize: 28,
  },
});
