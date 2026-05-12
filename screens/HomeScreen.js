import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import FeedCard from "../components/FeedCard";
import StoriesBar from "../components/StoriesBar";
import API from "../api";

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "book", label: "Books" },
  { key: "poem", label: "Poems" },
  { key: "short_story", label: "Stories" },
  { key: "audiobook", label: "Audio" },
  { key: "video", label: "Videos" },
  { key: "image", label: "Images" },
];

export default function HomeScreen({ user, onLogout, onNavigate }) {
  const [feed, setFeed] = useState([]);
  const [filteredFeed, setFilteredFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    filterFeed();
  }, [feed, activeFilter, searchQuery]);

  const fetchFeed = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      fadeAnim.setValue(0);
      const res = await API.get(`/feed/?user_id=${user.id}`);
      const feedData = res.data?.items || res.data?.results || res.data || [];
      setFeed(Array.isArray(feedData) ? feedData : []);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed();
  }, []);

  const filterFeed = () => {
    if (!Array.isArray(feed)) {
      setFilteredFeed([]);
      return;
    }
    let filtered = [...feed];

    // Filter by type
    if (activeFilter !== "all") {
      filtered = filtered.filter((item) => item && item.content_type === activeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item && (
            (item.title && item.title.toLowerCase().includes(query)) ||
            (item.author_name && item.author_name.toLowerCase().includes(query)) ||
            (item.description && item.description.toLowerCase().includes(query))
          )
      );
    }

    setFilteredFeed(filtered);
  };

  const handleCardPress = (item) => {
    if (item.content_type === "book") {
      onNavigate("BookDetail", { book: item });
    } else if (item.content_type === "poem") {
      onNavigate("Poems", { poem: item });
    } else {
      // For other types, navigate to a generic detail or show alert
      onNavigate("BookDetail", { book: item });
    }
  };

  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <FlatList
        data={FILTER_TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterTabsContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === item.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(item.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === item.key && styles.filterTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderDrawer = () => {
    if (!menuVisible) return null;
    return (
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={() => setMenuVisible(false)} activeOpacity={1} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("Profile"); }}>
            <Ionicons name="person-outline" size={22} color={COLORS.primary} />
            <Text style={styles.drawerItemText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("SavedItems"); }}>
            <Ionicons name="bookmark-outline" size={22} color={COLORS.primary} />
            <Text style={styles.drawerItemText}>Saved Items</Text>
          </TouchableOpacity>

          {user?.is_admin && (
            <>
              <View style={styles.drawerDivider} />
              <Text style={styles.drawerSectionTitle}>Admin</Text>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("AdminPanel"); }}>
                <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Admin Panel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("AddBook"); }}>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Add Book</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("ManageAuthors"); }}>
                <Ionicons name="people-outline" size={22} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Manage Authors</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onNavigate("ManagePoems"); }}>
                <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
                <Text style={styles.drawerItemText}>Manage Poems</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.drawerDivider} />
          <TouchableOpacity style={styles.drawerItem} onPress={() => { setMenuVisible(false); onLogout(); }}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text style={[styles.drawerItemText, { color: COLORS.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)} activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>मीमांसा</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => onNavigate("Profile")} activeOpacity={0.7}>
          {user?.profile_photo ? (
            <Image source={{ uri: user.profile_photo }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={18} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stories Bar */}
      <StoriesBar
        user={user}
        onViewStory={(storyUserId) => onNavigate("StoryViewer", { storyUserId })}
        onCreateStory={() => onNavigate("CreateStory")}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search feed..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filteredFeed}
            keyExtractor={(item, index) => `${item.content_type}-${item.id}-${index}`}
            renderItem={({ item }) => (
              <FeedCard
                item={item}
                userId={user?.id}
                onPress={() => handleCardPress(item)}
              />
            )}
            contentContainerStyle={styles.feedContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery ? "No results found" : "No content in feed yet"}
                </Text>
              </View>
            }
          />
        </Animated.View>
      )}

      {/* Drawer */}
      {renderDrawer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterTabsContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
  },
  filterTabsContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  feedContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SPACING.xxl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "75%",
    maxWidth: 300,
    backgroundColor: COLORS.surface,
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.lg,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  drawerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  drawerItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  drawerSectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    marginVertical: SPACING.sm,
  },
});
