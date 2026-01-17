import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator, StyleSheet, Animated, TextInput, Modal } from "react-native";
import API from "../api";

export default function HomeScreen({ user, onLogout, onNavigate }) {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [menuVisible, setMenuVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterTab, setFilterTab] = useState("category"); // "category" or "author"

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
    fetchGenres();
    fetchBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, selectedCategories, selectedAuthors, selectedGenres, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchAuthors = async () => {
    try {
      const res = await API.get("/authors/");
      setAuthors(res.data);
    } catch (err) {
      console.error("Error fetching authors:", err);
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await API.get("/genres/");
      setGenres(res.data);
    } catch (err) {
      console.error("Error fetching genres:", err);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      fadeAnim.setValue(0);
      const res = await API.get("/books/");
      setBooks(res.data);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];

    // Filter by categories (multiple)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(book => selectedCategories.includes(book.category));
    }

    // Filter by authors (multiple)
    if (selectedAuthors.length > 0) {
      filtered = filtered.filter(book => selectedAuthors.includes(book.author));
    }

    // Filter by genres (multiple)
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(book => selectedGenres.includes(book.genre));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) ||
        (book.author_name && book.author_name.toLowerCase().includes(query)) ||
        (book.category_name && book.category_name.toLowerCase().includes(query)) ||
        (book.genre_display && book.genre_display.toLowerCase().includes(query))
      );
    }

    setFilteredBooks(filtered);
  };

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleAuthor = (authId) => {
    setSelectedAuthors(prev => 
      prev.includes(authId) ? prev.filter(id => id !== authId) : [...prev, authId]
    );
  };

  const toggleGenre = (genreValue) => {
    setSelectedGenres(prev => 
      prev.includes(genreValue) ? prev.filter(v => v !== genreValue) : [...prev, genreValue]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setSelectedGenres([]);
  };

  const renderBook = ({ item }) => {
    if (viewMode === "list") {
      return (
        <TouchableOpacity 
          style={styles.bookListItem}
          onPress={() => onNavigate("BookDetail", { book: item })}
          activeOpacity={0.7}
        >
          {item.cover_image_url ? (
            <Image 
              source={{ uri: item.cover_image_url }} 
              style={styles.bookListCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookListCoverPlaceholder}>
              <Text style={styles.placeholderIconSmall}>📚</Text>
            </View>
          )}
          <View style={styles.bookListInfo}>
            <Text style={styles.bookListTitle} numberOfLines={2}>{item.title}</Text>
            {item.author_name && (
              <Text style={styles.bookListAuthor}>by {item.author_name}</Text>
            )}
            <View style={styles.bookListMeta}>
              {item.genre_display && (
                <Text style={styles.bookListGenre}>🎭 {item.genre_display}</Text>
              )}
              {item.category_name && (
                <Text style={styles.bookListCategory}>{item.category_name}</Text>
              )}
              {item.published_year && (
                <Text style={styles.bookListYear}>{item.published_year}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, item.is_paid ? styles.statusCheckedOut : styles.statusAvailable]}>
            <Text style={styles.statusText}>{item.is_paid ? "Paid" : "Available"}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Grid view (default)
    return (
      <TouchableOpacity 
        style={styles.bookCard}
        onPress={() => onNavigate("BookDetail", { book: item })}
        activeOpacity={0.7}
      >
        <View style={styles.bookCardImageContainer}>
          {item.cover_image_url ? (
            <Image 
              source={{ uri: item.cover_image_url }} 
              style={styles.bookCardCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bookCardCoverPlaceholder}>
              <Text style={styles.placeholderIcon}>📚</Text>
            </View>
          )}
          <View style={[styles.statusBadgeCard, item.is_paid ? styles.statusCheckedOut : styles.statusAvailable]}>
            <Text style={styles.statusTextCard}>{item.is_paid ? "Paid" : "Available"}</Text>
          </View>
        </View>
        <View style={styles.bookCardInfo}>
          <Text style={styles.bookCardTitle} numberOfLines={2}>{item.title}</Text>
          {item.author_name && (
            <Text style={styles.bookCardAuthor} numberOfLines={1}>by {item.author_name}</Text>
          )}
          {item.genre_display && (
            <Text style={styles.bookCardGenre} numberOfLines={1}>🎭 {item.genre_display}</Text>
          )}
          <View style={styles.bookCardFooter}>
            {item.category_name && (
              <Text style={styles.bookCardCategory}>{item.category_name}</Text>
            )}
            {item.published_year && (
              <Text style={styles.bookCardYear}>{item.published_year}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Hamburger Menu */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
          activeOpacity={0.7}
        >
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.username}>{user.username}</Text>
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, authors, or genres..."
          placeholderTextColor="#a0aec0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setFilterTab("category");
            setFilterModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          <Text style={styles.filterButtonText}>Filter</Text>
          {(selectedCategories.length + selectedAuthors.length + selectedGenres.length) > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {selectedCategories.length + selectedAuthors.length + selectedGenres.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {(selectedCategories.length + selectedAuthors.length + selectedGenres.length) > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Books Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : filteredBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? `No books found for "${searchQuery}"` : "No books found"}
          </Text>
          {user.is_admin && !searchQuery && (
            <TouchableOpacity 
              style={styles.addFirstButton}
              onPress={() => onNavigate("AddBook")}
            >
              <Text style={styles.addFirstButtonText}>Add First Book</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{filteredBooks.length} books found</Text>
            <TouchableOpacity 
              style={styles.viewToggle}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              activeOpacity={0.7}
            >
              <Text style={styles.viewToggleText}>
                {viewMode === "grid" ? "☰ List" : "⊞ Grid"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <FlatList
              data={filteredBooks}
              renderItem={renderBook}
              keyExtractor={(item) => item.id.toString()}
              numColumns={viewMode === "grid" ? 2 : 1}
              key={viewMode}
              contentContainerStyle={styles.booksGrid}
              columnWrapperStyle={viewMode === "grid" ? styles.columnWrapper : null}
            />
          </Animated.View>
        </>
      )}

      {/* Side Drawer Menu - Outside main container for proper z-index */}
      {menuVisible && (
        <>
          <TouchableOpacity 
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.userAvatar}>
                {user.profile_photo ? (
                  <Image 
                    source={{ uri: user.profile_photo }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.drawerUsername}>{user.username}</Text>
              <Text style={styles.drawerEmail}>{user.email || "User"}</Text>
            </View>

            <View style={styles.drawerContent}>
              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  onNavigate("Profile");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.drawerItemIcon}>👤</Text>
                <Text style={styles.drawerItemText}>My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  onNavigate("Poems");
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.drawerItemIcon}>📝</Text>
                <Text style={styles.drawerItemText}>कविताएँ (Poems)</Text>
              </TouchableOpacity>

              {user.is_admin && (
                <TouchableOpacity 
                  style={styles.drawerItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onNavigate("AdminPanel");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.drawerItemIcon}>⚙️</Text>
                  <Text style={styles.drawerItemText}>Admin Panel</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.drawerItem}
                onPress={() => {
                  setMenuVisible(false);
                  onLogout();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.drawerItemIcon}>🚪</Text>
                <Text style={styles.drawerItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Books</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, filterTab === "category" && styles.tabActive]}
                onPress={() => setFilterTab("category")}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, filterTab === "category" && styles.tabTextActive]}>
                  Category & Genre
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, filterTab === "author" && styles.tabActive]}
                onPress={() => setFilterTab("author")}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, filterTab === "author" && styles.tabTextActive]}>
                  Author
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {filterTab === "category" ? (
                <>
                  {/* Categories */}
                  <Text style={styles.filterSectionTitle}>Categories</Text>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={`modal-cat-${cat.id}`}
                      style={styles.filterOption}
                      onPress={() => toggleCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, selectedCategories.includes(cat.id) && styles.checkboxChecked]}>
                        {selectedCategories.includes(cat.id) && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.filterOptionText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Genres */}
                  <Text style={styles.filterSectionTitle}>Genres</Text>
                  {genres.map((genre) => (
                    <TouchableOpacity
                  key={`modal-genre-${genre.value}`}
                  style={styles.filterOption}
                  onPress={() => toggleGenre(genre.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selectedGenres.includes(genre.value) && styles.checkboxChecked]}>
                    {selectedGenres.includes(genre.value) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.filterOptionText}>🎭 {genre.label}</Text>
                </TouchableOpacity>
              ))}
                </>
              ) : (
                <>
                  {/* Authors */}
                  <Text style={styles.filterSectionTitle}>Authors</Text>
                  {authors.map((author) => (
                    <TouchableOpacity
                  key={`modal-auth-${author.id}`}
                  style={styles.filterOption}
                  onPress={() => toggleAuthor(author.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, selectedAuthors.includes(author.id) && styles.checkboxChecked]}>
                    {selectedAuthors.includes(author.id) && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.filterOptionText}>👤 {author.name}</Text>
                </TouchableOpacity>
              ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: "#fff",
    marginVertical: 3,
    borderRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 12,
    color: "#bee3f8",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  username: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9998,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  drawerHeader: {
    backgroundColor: "#4299e1",
    padding: 24,
    paddingTop: 60,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4299e1",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  drawerUsername: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  drawerEmail: {
    fontSize: 14,
    color: "#bee3f8",
    fontWeight: "500",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  drawerItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c",
  },
  menuIcon: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 28,
  },
  filterToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterToggle: {
    flex: 1,
    backgroundColor: "#edf2f7",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  filterToggleActive: {
    backgroundColor: "#805ad5",
    shadowColor: "#805ad5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterToggleText: {
    color: "#4a5568",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  filterToggleTextActive: {
    color: "#fff",
  },
  categoriesContainer: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryChip: {
    backgroundColor: "#edf2f7",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genreChip: {
    backgroundColor: "#f3e8ff",
  },
  categoryChipActive: {
    backgroundColor: "#4299e1",
    borderColor: "#3182ce",
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    color: "#4a5568",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  categoryTextActive: {
    color: "#fff",
  },
  booksGrid: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  bookCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 6,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: "48%",
  },
  bookCover: {
    width: "100%",
    height: 240,
    backgroundColor: "#edf2f7",
  },
  bookCoverPlaceholder: {
    width: "100%",
    height: 240,
    backgroundColor: "#edf2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 60,
    color: "#cbd5e0",
  },
  bookInfo: {
    padding: 14,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1a202c",
    letterSpacing: -0.2,
  },
  bookAuthor: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 6,
    fontWeight: "600",
  },
  bookCategory: {
    fontSize: 12,
    color: "#a0aec0",
    fontWeight: "600",
  },
  bookPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#48bb78",
    marginTop: 10,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 16,
    color: "#718096",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 90,
    marginBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 17,
    color: "#a0aec0",
    fontWeight: "600",
  },
  addFirstButton: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a202c",
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: "#a0aec0",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  resultsCount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d3748",
    letterSpacing: 0.3,
  },
  viewToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#edf2f7",
    borderRadius: 8,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4a5568",
  },
  bookListItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bookListCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  bookListCoverPlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#edf2f7",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconSmall: {
    fontSize: 24,
  },
  bookListInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  bookListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a202c",
    marginBottom: 4,
  },
  bookListAuthor: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 6,
  },
  bookListMeta: {
    flexDirection: "row",
    gap: 8,
  },
  bookListCategory: {
    fontSize: 12,
    color: "#4a5568",
    fontWeight: "600",
  },
  bookListGenre: {
    fontSize: 11,
    color: "#805ad5",
    fontWeight: "600",
    marginRight: 8,
  },
  bookListYear: {
    fontSize: 12,
    color: "#a0aec0",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusAvailable: {
    backgroundColor: "#48bb78",
  },
  statusCheckedOut: {
    backgroundColor: "#f56565",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  bookCardImageContainer: {
    position: "relative",
  },
  statusBadgeCard: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextCard: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  bookCardCover: {
    width: "100%",
    height: 240,
    backgroundColor: "#edf2f7",
  },
  bookCardCoverPlaceholder: {
    width: "100%",
    height: 240,
    backgroundColor: "#edf2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  bookCardInfo: {
    padding: 14,
  },
  bookCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1a202c",
    letterSpacing: -0.2,
  },
  bookCardAuthor: {
    fontSize: 13,
    color: "#718096",
    marginBottom: 6,
    fontWeight: "600",
  },
  bookCardGenre: {
    fontSize: 11,
    color: "#805ad5",
    fontWeight: "600",
    marginBottom: 6,
  },
  bookCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookCardCategory: {
    fontSize: 12,
    color: "#4a5568",
    fontWeight: "600",
  },
  bookCardYear: {
    fontSize: 12,
    color: "#a0aec0",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4299e1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  filterBadge: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterBadgeText: {
    color: "#4299e1",
    fontSize: 12,
    fontWeight: "800",
  },
  clearFiltersButton: {
    backgroundColor: "#f56565",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#4299e1",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#718096",
  },
  tabTextActive: {
    color: "#4299e1",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a202c",
  },
  modalClose: {
    fontSize: 28,
    color: "#718096",
    fontWeight: "300",
  },
  modalBody: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2d3748",
    marginTop: 16,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#cbd5e0",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4299e1",
    borderColor: "#4299e1",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  filterOptionText: {
    fontSize: 15,
    color: "#2d3748",
    fontWeight: "600",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  applyButton: {
    backgroundColor: "#48bb78",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
