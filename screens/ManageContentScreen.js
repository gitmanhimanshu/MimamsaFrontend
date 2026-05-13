import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  FlatList,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import API, { uploadImage } from "../api";

/**
 * Generic admin screen for managing one content type (Short Story / Audiobook
 * / Video / Image). The shape is driven by the `config` prop loaded from
 * contentConfigs.js — see that file for the per-type field lists.
 *
 * Backend endpoints accept `user_id` in the POST/PUT/DELETE body for the
 * admin check.
 */
export default function ManageContentScreen({ user, config, onBack }) {
  const [items, setItems] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...config.initialForm });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, authorsRes] = await Promise.all([
        API.get(config.endpoint),
        API.get("/authors/"),
      ]);
      setItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setAuthors(Array.isArray(authorsRes.data) ? authorsRes.data : []);
    } catch (err) {
      console.error(`Error loading ${config.label}:`, err);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint, config.label]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...config.initialForm });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    // Hydrate the form with the item's current values (falling back to defaults).
    const hydrated = { ...config.initialForm };
    Object.keys(config.initialForm).forEach((key) => {
      if (item[key] !== undefined && item[key] !== null) {
        hydrated[key] = item[key];
      }
    });
    // author comes back as an id (number); fields expect string.
    if (hydrated.author !== undefined && hydrated.author !== "") {
      hydrated.author = String(hydrated.author);
    }
    setForm(hydrated);
    setShowForm(true);
  };

  const pickImageField = async (fieldName) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setUploadingImage(true);
      const data = await uploadImage({
        uri: result.assets[0].uri,
        type: "image/jpeg",
        name: `${fieldName}_${Date.now()}.jpg`,
      });
      setForm((prev) => ({ ...prev, [fieldName]: data.url }));
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const validate = () => {
    for (const field of config.fields) {
      if (field.required) {
        const value = form[field.name];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (typeof value === "string" && value.trim() === "");
        if (isEmpty) {
          Alert.alert("Required", `${field.label} is required`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.is_admin) {
      Alert.alert("Permission denied", `Only admins can manage ${config.label.toLowerCase()}.`);
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      // Normalize: author "" → null, numeric fields → number.
      const payload = { ...form, user_id: user.id };
      if (payload.author === "") payload.author = null;
      if (payload.duration !== undefined && payload.duration !== "")
        payload.duration = parseInt(payload.duration) || 0;
      if (payload.reading_time !== undefined && payload.reading_time !== "")
        payload.reading_time = parseInt(payload.reading_time) || 0;
      if (payload.price !== undefined) {
        payload.price = payload.is_paid && payload.price ? parseFloat(payload.price) : null;
      }

      if (editingItem) {
        await API.put(`${config.endpoint}${editingItem.id}/`, payload);
      } else {
        await API.post(config.endpoint, payload);
      }
      setShowForm(false);
      fetchData();
      Alert.alert("Success", `${config.label.slice(0, -1)} ${editingItem ? "updated" : "added"} successfully`);
    } catch (err) {
      console.error("Error saving:", err);
      Alert.alert(
        "Error",
        err.response?.data?.error || `Failed to save ${config.label.toLowerCase()}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      `Delete ${config.label.slice(0, -1)}`,
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`${config.endpoint}${item.id}/`, {
                data: { user_id: user.id },
              });
              fetchData();
            } catch (err) {
              Alert.alert("Error", "Failed to delete");
            }
          },
        },
      ]
    );
  };

  const renderField = (field) => {
    if (field.showIf && !field.showIf(form)) return null;
    const value = form[field.name];
    const setValue = (v) => setForm((prev) => ({ ...prev, [field.name]: v }));

    if (field.type === "text" || field.type === "number") {
      return (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <TextInput
            style={styles.input}
            value={value !== undefined && value !== null ? String(value) : ""}
            onChangeText={setValue}
            placeholder={field.placeholder || ""}
            placeholderTextColor="#9ca3af"
            keyboardType={field.type === "number" ? "numeric" : "default"}
          />
        </View>
      );
    }

    if (field.type === "textarea") {
      return (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { minHeight: 24 * (field.rows || 3) }]}
            value={value || ""}
            onChangeText={setValue}
            placeholder={field.placeholder || ""}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={field.rows || 3}
            textAlignVertical="top"
          />
        </View>
      );
    }

    if (field.type === "select") {
      const options =
        field.options ||
        (field.optionsKey ? config[field.optionsKey] || [] : []);
      return (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  value === opt.value && styles.chipActive,
                ]}
                onPress={() => setValue(opt.value)}
              >
                <Text
                  style={[
                    styles.chipText,
                    value === opt.value && styles.chipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (field.type === "authorSelect") {
      return (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>Author</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            <TouchableOpacity
              style={[styles.chip, !value && styles.chipActive]}
              onPress={() => setValue("")}
            >
              <Text style={[styles.chipText, !value && styles.chipTextActive]}>None</Text>
            </TouchableOpacity>
            {authors.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.chip,
                  String(value) === String(a.id) && styles.chipActive,
                ]}
                onPress={() => setValue(String(a.id))}
              >
                <Text
                  style={[
                    styles.chipText,
                    String(value) === String(a.id) && styles.chipTextActive,
                  ]}
                >
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (field.type === "image") {
      return (
        <View key={field.name} style={styles.inputGroup}>
          <Text style={styles.label}>
            {field.label}
            {field.required ? " *" : ""}
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImageField(field.name)}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadButtonText}>
                  {value ? "Replace Image" : "Upload Image"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {value ? (
            <Image
              source={{ uri: value }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : null}
        </View>
      );
    }

    if (field.type === "switch") {
      return (
        <View key={field.name} style={[styles.inputGroup, styles.switchRow]}>
          <Text style={styles.label}>{field.label}</Text>
          <Switch
            value={!!value}
            onValueChange={setValue}
            trackColor={{ false: "#4b5563", true: "#4299e1" }}
            thumbColor="#fff"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FF7700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage {config.label}</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addButton} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#FF7700" size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${config.endpoint}-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemMeta} numberOfLines={1}>
                  {item.author_name || "Unknown"} •{" "}
                  {item.genre || item.category || ""}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEdit(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={36} color="#9ca3af" />
              <Text style={styles.emptyText}>No {config.label.toLowerCase()} yet</Text>
            </View>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowForm(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#FF7700" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>
              {editingItem ? "Edit" : "Add"} {config.label.slice(0, -1)}
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving || uploadingImage}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveText, (saving || uploadingImage) && { opacity: 0.5 }]}>
                {saving ? "..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {config.fields.map(renderField)}
            <View style={{ height: 60 }} />
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
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF7700",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 15,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  itemTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemMeta: {
    color: "#4299e1",
    fontSize: 13,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4299e1",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 12,
  },
  modalContainer: {
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
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  saveText: {
    color: "#FF7700",
    fontSize: 16,
    fontWeight: "700",
  },
  formContent: {
    padding: 15,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  textArea: {
    textAlignVertical: "top",
  },
  chipRow: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#FF7700",
    borderColor: "#FF7700",
  },
  chipText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4299e1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#2a2a2a",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
