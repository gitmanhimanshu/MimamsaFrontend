import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, StyleSheet } from "react-native";
import API from "../api";

export default function AdminPanelScreen({ user, onBack, onNavigate }) {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksRes, categoriesRes, authorsRes] = await Promise.all([
        API.get("/books/?show_all=true"),  // Fetch all books including inactive
        API.get("/categories/"),
        API.get("/authors/")
      ]);
      setBooks(booksRes.data);
      setCategories(categoriesRes.data);
      setAuthors(authorsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId) => {
    Alert.alert(
      "Permanently Delete Book",
      "This will permanently delete the book from database. This action cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/books/${bookId}/`, {
                data: { user_id: user.id }
              });
              Alert.alert("Success", "Book permanently deleted");
              fetchData();
            } catch (err) {
              Alert.alert("Error", "Failed to delete book");
            }
          }
        }
      ]
    );
  };

  const toggleBookStatus = async (bookId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      await API.put(`/books/${bookId}/`, {
        user_id: user.id,
        is_active: newStatus
      });
      Alert.alert("Success", `Book ${newStatus ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err) {
      Alert.alert("Error", "Failed to update book status");
    }
  };

  const renderBook = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{item.is_active ? "Active" : "Inactive"}</Text>
          </View>
        </View>
        <Text style={styles.itemSubtitle}>
          {item.author_name || "No author"} • {item.category_name || "No category"}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.toggleButton, item.is_active ? styles.deactivateButton : styles.activateButton]}
          onPress={() => toggleBookStatus(item.id, item.is_active)}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleButtonText}>
            {item.is_active ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onNavigate("EditBook", { book: item })}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteBook(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
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
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{books.length}</Text>
              <Text style={styles.statLabel}>Books</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{authors.length}</Text>
              <Text style={styles.statLabel}>Authors</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate("AddBook")}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>+ Add New Book</Text>
            </TouchableOpacity>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButtonSmall}
                onPress={() => onNavigate("ManageCategories")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonSmallText}>Manage Categories</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButtonSmall}
                onPress={() => onNavigate("ManageAuthors")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionButtonSmallText}>Manage Authors</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: "#9f7aea" }]}
              onPress={() => onNavigate("ManagePoems")}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>📝 Manage Poems</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>All Books</Text>
            <FlatList
              data={books}
              renderItem={renderBook}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No books yet</Text>
                </View>
              }
            />
          </View>

          {/* Floating Action Button for Mobile */}
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => onNavigate("AddBook")}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </>
      )}
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
    letterSpacing: 0.3,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#718096",
    marginTop: 18,
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "#4299e1",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: "#718096",
    marginTop: 6,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#48bb78",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButtonSmall: {
    flex: 1,
    backgroundColor: "#4299e1",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonSmallText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  listSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a202c",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  itemCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: -0.2,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: "#48bb78",
  },
  statusInactive: {
    backgroundColor: "#cbd5e0",
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  itemSubtitle: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activateButton: {
    backgroundColor: "#48bb78",
    shadowColor: "#48bb78",
  },
  deactivateButton: {
    backgroundColor: "#ed8936",
    shadowColor: "#ed8936",
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  editButton: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  deleteButton: {
    backgroundColor: "#f56565",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#f56565",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: "#a0aec0",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#48bb78",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#48bb78",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },
});
