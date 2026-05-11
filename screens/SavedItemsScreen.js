import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import API from "../api";

const TYPE_LABELS = {
  book: "Book",
  poem: "Poem",
  short_story: "Story",
  audiobook: "Audiobook",
  video: "Video",
  image: "Image",
};

const TYPE_COLORS = {
  book: "#3b82f6",
  poem: "#ec4899",
  short_story: "#8b5cf6",
  audiobook: "#f59e0b",
  video: "#ef4444",
  image: "#10b981",
};

export default function SavedItemsScreen({ user, onBack, onNavigate }) {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/bookmarks/?user_id=${user.id}`);
      setSavedItems(res.data || []);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Error fetching saved items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (item) => {
    try {
      await API.post("/bookmarks/toggle/", {
        user_id: user.id,
        content_type: item.content_type,
        content_id: item.content_id,
      });
      setSavedItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error("Error unsaving item:", error);
    }
  };

  const renderItem = ({ item }) => {
    const content = item.content_data || item;
    const contentType = content.content_type || item.content_type || "book";
    const typeLabel = TYPE_LABELS[contentType] || "Content";
    const typeColor = TYPE_COLORS[contentType] || COLORS.primary;
    const imageUrl =
      content.cover_image_url || content.thumbnail_url || content.image_url || content.background_image_url;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => onNavigate("BookDetail", { book: content })}
          activeOpacity={0.9}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={24} color={COLORS.textMuted} />
            </View>
          )}
          <View style={styles.info}>
            <View style={styles.headerRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeColor + "15" }]}>
                <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {content.title || "Untitled"}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {content.author_name || content.user_name || "Unknown"}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.unsaveButton} onPress={() => handleUnsave(item)} activeOpacity={0.7}>
          <Ionicons name="bookmark" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Items</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={savedItems}
            keyExtractor={(item) => `saved-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="bookmark-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No saved items yet</Text>
                <Text style={styles.emptySubtext}>Tap the bookmark icon on any content to save it here</Text>
              </View>
            }
          />
        </Animated.View>
      )}
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
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
  },
  coverImage: {
    width: 70,
    height: 90,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray[100],
  },
  coverPlaceholder: {
    width: 70,
    height: 90,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  author: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  unsaveButton: {
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SPACING.xxl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
});
