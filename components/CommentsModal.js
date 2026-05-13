import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../api";
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from "../constants/theme";

export default function CommentsModal({ visible, item, contentType, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [delta, setDelta] = useState(0);

  const itemId = item?.id;

  const fetchComments = useCallback(async () => {
    if (!itemId || !contentType) return;
    try {
      setLoading(true);
      const res = await API.get(
        `/comments/?content_type=${contentType}&content_id=${itemId}`
      );
      // Backend returns { count, comments: [...] } — unwrap.
      setComments(res.data?.comments || []);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  }, [itemId, contentType]);

  useEffect(() => {
    if (visible) {
      setText("");
      setDelta(0);
      fetchComments();
    }
  }, [visible, fetchComments]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!user?.id) {
      Alert.alert("Login required", "Please log in to comment.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await API.post("/comments/", {
        user_id: user.id,
        content_type: contentType,
        content_id: itemId,
        text: text.trim(),
      });
      // Backend returns { message, comment } — unwrap.
      const newComment = res.data?.comment;
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setDelta((d) => d + 1);
      }
      setText("");
    } catch (err) {
      console.error("Error posting comment:", err);
      Alert.alert("Error", "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!user?.id) return;
    try {
      await API.delete(`/comments/${comment.id}/`, {
        data: { user_id: user.id },
      });
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setDelta((d) => d - 1);
    } catch (err) {
      console.error("Error deleting comment:", err);
      Alert.alert("Error", "Failed to delete comment.");
    }
  };

  const renderItem = ({ item: c }) => {
    const isMine = c.user === user?.id;
    return (
      <View style={styles.commentRow}>
        {c.user_photo ? (
          <Image source={{ uri: c.user_photo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(c.user_name || "?")[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{c.user_name || "User"}</Text>
            {isMine && (
              <TouchableOpacity onPress={() => handleDelete(c)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentText}>{c.text}</Text>
          <Text style={styles.commentDate}>
            {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => onClose(delta)}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={() => onClose(delta)}
        />
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              Comments {comments.length > 0 ? `(${comments.length})` : ""}
            </Text>
            <TouchableOpacity onPress={() => onClose(delta)} hitSlop={8}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => `comment-${c.id}`}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={36}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    No comments yet. Be the first!
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={user ? "Write a comment..." : "Login to comment"}
              placeholderTextColor={COLORS.textMuted}
              editable={!!user && !submitting}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!text.trim() || submitting || !user) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!text.trim() || submitting || !user}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: "85%",
    minHeight: "60%",
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  loadingBox: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
  },
  commentBody: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  commentAuthor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  commentText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  commentDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.full,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
});
