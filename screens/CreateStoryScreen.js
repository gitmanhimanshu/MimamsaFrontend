import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import API, { uploadImage } from "../api";

const FONT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "serif", label: "Classic" },
];

const BG_COLORS = [
  "#FF7700", "#E91E63", "#9C27B0", "#673AB7",
  "#3F51B5", "#2196F3", "#009688", "#4CAF50",
  "#8BC34A", "#CDDC39", "#FFEB3B", "#FF9800",
  "#795548", "#607D8B", "#000000", "#FFFFFF",
];

export default function CreateStoryScreen({ user, onBack, onSuccess }) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#FF7700");
  const [fontStyle, setFontStyle] = useState("normal");
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setPreviewUri(uri);
        setUploading(true);

        // Use the dedicated uploadImage helper which uses raw axios — the shared
        // API instance defaults to application/json, which clobbers the
        // multipart boundary when reused for file uploads.
        const data = await uploadImage({
          uri,
          type: "image/jpeg",
          name: `story_${Date.now()}.jpg`,
        });
        setImageUrl(data.url || data.secure_url);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!imageUrl && !caption.trim()) {
      Alert.alert("Info", "Please add an image or some text");
      return;
    }

    try {
      await API.post("/stories/create/", {
        user_id: user.id,
        image_url: imageUrl || "",
        caption: caption,
        background_color: backgroundColor,
        font_style: fontStyle,
      });

      Alert.alert("Success", "Story published!", [
        { text: "OK", onPress: () => { onSuccess?.(); onBack(); } },
      ]);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to publish story";
      Alert.alert("Error", msg);
    }
  };

  const getFontWeight = () => (fontStyle === "bold" ? "800" : "700");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <TouchableOpacity
          style={[styles.publishButton, (!imageUrl && !caption.trim()) && styles.publishButtonDisabled]}
          onPress={handleSubmit}
          disabled={!imageUrl && !caption.trim()}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="checkmark" size={22} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewContainer}>
          {previewUri || imageUrl ? (
            <Image source={{ uri: previewUri || imageUrl }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={[styles.previewColorBg, { backgroundColor }]}>
              <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Caption overlay on preview */}
          {caption ? (
            <View style={styles.captionOverlay} pointerEvents="none">
              <Text
                style={[
                  styles.captionPreviewText,
                  {
                    fontStyle: fontStyle === "italic" ? "italic" : "normal",
                    fontWeight: getFontWeight(),
                  },
                ]}
              >
                {caption}
              </Text>
            </View>
          ) : null}

          {/* Change image button */}
          <TouchableOpacity style={styles.changeImageButton} onPress={pickImage} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={16} color={COLORS.white} />
            <Text style={styles.changeImageText}>{imageUrl ? "Change" : "Add Image"}</Text>
          </TouchableOpacity>
        </View>

        {/* Caption Input */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Ionicons name="text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.label}>Text / Caption</Text>
          </View>
          <TextInput
            style={styles.textArea}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write something..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Background Color (when no image) */}
        {!imageUrl && (
          <View style={styles.section}>
            <Text style={styles.label}>Background Color</Text>
            <View style={styles.colorGrid}>
              {BG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: color,
                      borderWidth: backgroundColor === color ? 3 : 0,
                      borderColor: COLORS.textPrimary,
                    },
                  ]}
                  onPress={() => setBackgroundColor(color)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          </View>
        )}

        {/* Font Style */}
        <View style={styles.section}>
          <Text style={styles.label}>Font Style</Text>
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map((font) => (
              <TouchableOpacity
                key={font.value}
                style={[
                  styles.fontChip,
                  fontStyle === font.value && styles.fontChipActive,
                ]}
                onPress={() => setFontStyle(font.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.fontChipText,
                    fontStyle === font.value && styles.fontChipTextActive,
                    {
                      fontStyle: font.value === "italic" ? "italic" : "normal",
                      fontWeight: font.value === "bold" ? "700" : "500",
                    },
                  ]}
                >
                  {font.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const PREVIEW_HEIGHT = 420;

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
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  publishButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.md,
  },
  publishButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  previewContainer: {
    height: PREVIEW_HEIGHT,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewColorBg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  captionOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  captionPreviewText: {
    color: COLORS.white,
    fontSize: 22,
    textAlign: "center",
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: BORDER_RADIUS.md,
  },
  changeImageText: {
    color: COLORS.white,
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 80,
    ...SHADOWS.sm,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fontRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fontChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
  },
  fontChipActive: {
    backgroundColor: COLORS.primary,
  },
  fontChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  fontChipTextActive: {
    color: COLORS.white,
  },
});
