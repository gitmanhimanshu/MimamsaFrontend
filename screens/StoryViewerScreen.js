import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../constants/theme";
import API from "../api";

const { width, height } = Dimensions.get("window");
const STORY_DURATION = 5000;

export default function StoryViewerScreen({ userId, viewerId, onClose }) {
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedProgressRef = useRef(0);

  useEffect(() => {
    fetchUserStories();
  }, [userId]);

  const fetchUserStories = async () => {
    try {
      const res = await API.get(`/stories/user/${userId}/?viewer_id=${viewerId || ""}`);
      setStories(res.data.stories || []);
    } catch (err) {
      console.error("Error fetching stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = useCallback(
    async (storyId) => {
      if (!viewerId) return;
      try {
        await API.get(`/stories/${storyId}/?user_id=${viewerId}`);
      } catch (err) {
        console.error("Error marking story as viewed:", err);
      }
    },
    [viewerId]
  );

  // Progress animation
  useEffect(() => {
    if (stories.length === 0 || isPaused) return;

    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const totalProgress = pausedProgressRef.current + elapsed;
      const pct = Math.min((totalProgress / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (totalProgress >= STORY_DURATION) {
        goToNext();
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentIndex, stories.length, isPaused]);

  const goToNext = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    pausedProgressRef.current = 0;
    setProgress(0);

    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goToPrev = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    pausedProgressRef.current = 0;
    setProgress(0);

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handlePause = () => {
    setIsPaused(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    pausedProgressRef.current += Date.now() - (startTimeRef.current || Date.now());
  };

  const handleResume = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const handleDelete = async (storyId) => {
    try {
      await API.delete(`/stories/${storyId}/`, { data: { user_id: viewerId } });
      const filtered = stories.filter((_, i) => i !== currentIndex);
      if (filtered.length === 0) {
        onClose();
      } else {
        setStories(filtered);
        if (currentIndex >= filtered.length) {
          setCurrentIndex(filtered.length - 1);
        }
        pausedProgressRef.current = 0;
        setProgress(0);
      }
    } catch (err) {
      console.error("Error deleting story:", err);
    }
  };

  // Mark current story as viewed
  useEffect(() => {
    if (stories[currentIndex]) {
      markAsViewed(stories[currentIndex].id);
    }
  }, [currentIndex, stories, markAsViewed]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  if (stories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No stories available</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    );
  }

  const currentStory = stories[currentIndex];
  const isOwnStory = viewerId === currentStory?.user;

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
        <Ionicons name="close" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, idx) => (
          <View key={idx} style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Story Info */}
      <View style={styles.infoContainer}>
        {currentStory?.user_photo ? (
          <Image source={{ uri: currentStory.user_photo }} style={styles.infoAvatar} />
        ) : (
          <View style={styles.infoAvatarPlaceholder}>
            <Text style={styles.infoAvatarInitial}>
              {currentStory?.user_name?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.infoText}>
          <Text style={styles.infoName}>{currentStory?.user_name}</Text>
          <Text style={styles.infoTime}>{currentStory?.time_left} left</Text>
        </View>
        {isOwnStory && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(currentStory.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Story Content with Touch Handlers */}
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPressIn={handlePause}
        onPressOut={handleResume}
      >
        {/* Background Image or Color */}
        {currentStory?.image_url ? (
          <Image source={{ uri: currentStory.image_url }} style={styles.storyImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.storyColorBg,
              { backgroundColor: currentStory?.background_color || COLORS.primary },
            ]}
          />
        )}

        {/* Caption Overlay */}
        {currentStory?.caption && (
          <View style={styles.captionOverlay} pointerEvents="none">
            <Text
              style={[
                styles.captionText,
                {
                  fontStyle: currentStory.font_style === "italic" ? "italic" : "normal",
                  fontFamily: currentStory.font_style === "serif" ? "serif" : undefined,
                  fontWeight: currentStory.font_style === "bold" ? "800" : "700",
                },
              ]}
            >
              {currentStory.caption}
            </Text>
          </View>
        )}

        {/* Navigation Zones - invisible touch areas */}
        <View style={styles.navZones} pointerEvents="box-none">
          <TouchableOpacity style={styles.navZoneLeft} onPress={goToPrev} activeOpacity={1} />
          <View style={styles.navZoneCenter} />
          <TouchableOpacity style={styles.navZoneRight} onPress={goToNext} activeOpacity={1} />
        </View>
      </TouchableOpacity>

      {/* Pause indicator */}
      {isPaused && (
        <View style={styles.pauseIndicator}>
          <Text style={styles.pauseText}>Paused</Text>
        </View>
      )}

      {/* Viewer count — bottom of screen */}
      <View style={styles.viewerCountBottom} pointerEvents="none">
        <Ionicons name="eye-outline" size={18} color={COLORS.white} />
        <Text style={styles.viewerCountBottomText}>
          {currentStory?.viewer_count || 0}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 50,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: BORDER_RADIUS.full,
  },
  progressContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 60,
    zIndex: 40,
    flexDirection: "row",
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  infoContainer: {
    position: "absolute",
    top: 62,
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  infoAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  infoAvatarInitial: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    flex: 1,
  },
  infoName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  infoTime: {
    ...TYPOGRAPHY.small,
    color: "rgba(255,255,255,0.7)",
  },
  deleteButton: {
    padding: 8,
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewerCountText: {
    ...TYPOGRAPHY.small,
    color: "rgba(255,255,255,0.7)",
  },
  viewerCountBottom: {
    position: "absolute",
    bottom: 30,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BORDER_RADIUS.full,
    zIndex: 50,
  },
  viewerCountBottomText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "700",
  },
  contentContainer: {
    width: width,
    height: height,
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  storyColorBg: {
    width: "100%",
    height: "100%",
  },
  captionOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  captionText: {
    color: COLORS.white,
    fontSize: 24,
    textAlign: "center",
    lineHeight: 36,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  navZones: {
    position: "absolute",
    inset: 0,
    flexDirection: "row",
  },
  navZoneLeft: {
    width: "33%",
    height: "100%",
  },
  navZoneCenter: {
    width: "34%",
    height: "100%",
  },
  navZoneRight: {
    width: "33%",
    height: "100%",
  },
  pauseIndicator: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BORDER_RADIUS.full,
  },
  pauseText: {
    color: COLORS.white,
    ...TYPOGRAPHY.body,
    fontWeight: "600",
  },
  emptyText: {
    color: COLORS.white,
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.lg,
  },
});
