import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import API from "../api";

const TYPE_LABELS = {
  book: "Book",
  poem: "Poem",
  story: "Story",
  audiobook: "Audiobook",
  video: "Video",
  image: "Image",
};

const TYPE_COLORS = {
  book: "#3b82f6",
  poem: "#ec4899",
  story: "#8b5cf6",
  audiobook: "#f59e0b",
  video: "#ef4444",
  image: "#10b981",
};

export default function FeedCard({ item, userId, onPress, onComment }) {
  const [liked, setLiked] = useState(item.user_liked || false);
  const [saved, setSaved] = useState(item.user_saved || false);
  const [likeCount, setLikeCount] = useState(item.like_count || 0);
  const [commentCount, setCommentCount] = useState(item.comment_count || 0);

  // Backend feed returns `type`; other endpoints return `content_type`. Support both.
  const contentType = item.type || item.content_type || "book";
  const typeLabel = TYPE_LABELS[contentType] || "Content";
  const typeColor = TYPE_COLORS[contentType] || COLORS.primary;

  const toggleLike = async () => {
    try {
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

      await API.post("/likes/toggle/", {
        user_id: userId,
        content_type: contentType,
        content_id: item.id,
      });
    } catch (error) {
      // Revert on error
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
      console.error("Error toggling like:", error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const newSaved = !saved;
      setSaved(newSaved);

      await API.post("/bookmarks/toggle/", {
        user_id: userId,
        content_type: contentType,
        content_id: item.id,
      });
    } catch (error) {
      setSaved(!saved);
      console.error("Error toggling bookmark:", error);
    }
  };

  // Feed uses `cover_image`; detail endpoints use `cover_image_url`/`thumbnail_url`/`image_url`/`background_image_url`.
  const imageUrl =
    item.cover_image ||
    item.cover_image_url ||
    item.thumbnail_url ||
    item.image_url ||
    item.background_image_url;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header: Avatar + Name + Type Badge */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {item.author_photo || item.user_photo ? (
            <Image
              source={{ uri: item.author_photo || item.user_photo }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color={COLORS.white} />
            </View>
          )}
          <Text style={styles.authorName} numberOfLines={1}>
            {item.author_name || item.user_name || "Unknown"}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "15" }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
      </View>

      {/* Content Image */}
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
      ) : null}

      {/* Title & Description */}
      <View style={styles.contentBody}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Full poem text on the feed card — feed projection already returns
            the entire content for poems (see UnifiedFeedView raw SQL).
            For short stories, show a preview only (their content can be long). */}
        {contentType === "poem" && item.content ? (
          <Text style={styles.poemContent}>{item.content}</Text>
        ) : null}
        {contentType === "story" && item.content ? (
          <Text style={styles.storyPreview} numberOfLines={6}>
            {item.content}
          </Text>
        ) : null}
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={toggleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={22}
            color={liked ? "#ef4444" : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            {likeCount > 0 ? likeCount : "Like"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
          onPress={() =>
            onComment &&
            onComment(item, contentType, (delta) =>
              setCommentCount((prev) => Math.max(0, prev + delta))
            )
          }
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>
            {commentCount > 0 ? commentCount : "Comment"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={toggleBookmark} activeOpacity={0.7}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={saved ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, saved && styles.actionTextActive]}>
            {saved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  authorName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeText: {
    ...TYPOGRAPHY.small,
    fontWeight: "700",
  },
  coverImage: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.gray[100],
  },
  contentBody: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  poemContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 26,
    fontStyle: "italic",
    fontFamily: "serif",
    marginTop: SPACING.sm,
  },
  storyPreview: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.lg,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  actionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
