import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../constants/theme";
import API from "../api";

export default function StoriesBar({ user, onViewStory, onCreateStory }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchStories = async () => {
    try {
      const res = await API.get(`/stories/?user_id=${user?.id || ""}`);
      setStories(res.data.bar_stories || []);
    } catch (err) {
      console.error("Error fetching stories:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonName} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button */}
        {user && (
          <TouchableOpacity
            style={styles.storyItem}
            onPress={onCreateStory}
            activeOpacity={0.8}
          >
            <View style={styles.addStoryAvatarContainer}>
              {user.profile_photo ? (
                <Image
                  source={{ uri: user.profile_photo }}
                  style={styles.addStoryAvatar}
                />
              ) : (
                <View style={styles.addStoryAvatarPlaceholder}>
                  <Text style={styles.addStoryAvatarInitial}>
                    {user.username?.[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.plusBadge}>
                <Ionicons name="add" size={14} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              Your Story
            </Text>
          </TouchableOpacity>
        )}

        {/* Story Items */}
        {stories.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={styles.storyItem}
            onPress={() => onViewStory(story.user)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.storyRing,
                story.is_viewed ? styles.storyRingViewed : styles.storyRingUnviewed,
              ]}
            >
              <View style={styles.storyAvatarInner}>
                {story.user_photo ? (
                  <Image
                    source={{ uri: story.user_photo }}
                    style={styles.storyAvatar}
                  />
                ) : (
                  <View style={styles.storyAvatarPlaceholder}>
                    <Text style={styles.storyAvatarInitial}>
                      {story.user_name?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.storyName} numberOfLines={1}>
              {story.user_name}
            </Text>
          </TouchableOpacity>
        ))}

        {stories.length === 0 && !user && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stories yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const AVATAR_SIZE = 64;
const RING_SIZE = 70;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
  },
  addStoryAvatarContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addStoryAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  addStoryAvatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addStoryAvatarInitial: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "700",
  },
  plusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  storyRingUnviewed: {
    backgroundColor: COLORS.primary,
  },
  storyRingViewed: {
    backgroundColor: COLORS.gray[300],
  },
  storyAvatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.white,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  storyAvatar: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
  },
  storyAvatarPlaceholder: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  storyAvatarInitial: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "700",
  },
  storyName: {
    ...TYPOGRAPHY.small,
    color: COLORS.textPrimary,
    marginTop: 4,
    textAlign: "center",
    width: 72,
  },
  skeletonItem: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
  },
  skeletonAvatar: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: COLORS.gray[200],
  },
  skeletonName: {
    width: 50,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray[200],
    marginTop: 6,
  },
  emptyContainer: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
