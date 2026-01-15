import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";

export default function BookDetailScreen({ book, onBack, onNavigate }) {
  const openReader = () => {
    if (book.content_url) {
      // Check if it's a PDF or EPUB
      const url = book.content_url.toLowerCase();
      if (url.includes('.pdf') || url.includes('.epub')) {
        onNavigate("Reader", { book });
      } else {
        // For other file types, open in browser
        alert("Opening file in browser...");
        // You can use Linking.openURL(book.content_url) here
      }
    } else {
      alert("No file available to read");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {book.cover_image_url ? (
          <Image 
            source={{ uri: book.cover_image_url }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.placeholderIcon}>📚</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{book.title}</Text>
          
          {book.author_name && (
            <Text style={styles.author}>by {book.author_name}</Text>
          )}
          
          <View style={styles.metaRow}>
            {book.category_name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{book.category_name}</Text>
              </View>
            )}
            {book.language && (
              <View style={styles.languageBadge}>
                <Text style={styles.languageText}>{book.language}</Text>
              </View>
            )}
            {book.published_year && (
              <View style={styles.yearBadge}>
                <Text style={styles.yearText}>{book.published_year}</Text>
              </View>
            )}
          </View>

          {book.is_paid && book.price && (
            <Text style={styles.price}>₹{book.price}</Text>
          )}

          {book.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>About this book</Text>
              <Text style={styles.description}>{book.description}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.readButton}
            onPress={openReader}
            activeOpacity={0.8}
          >
            <Text style={styles.readButtonText}>
              {book.is_paid ? "Buy & Read Now" : "Read Now"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f8",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 14,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4299e1",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  coverImage: {
    width: "100%",
    height: 480,
    backgroundColor: "#edf2f7",
  },
  coverPlaceholder: {
    width: "100%",
    height: 480,
    backgroundColor: "#edf2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 120,
    color: "#cbd5e0",
  },
  content: {
    backgroundColor: "#fff",
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 12,
    color: "#1a202c",
    letterSpacing: -0.5,
  },
  author: {
    fontSize: 18,
    color: "#718096",
    marginBottom: 18,
    fontStyle: "italic",
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  categoryBadge: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  languageBadge: {
    backgroundColor: "#805ad5",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    shadowColor: "#805ad5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  languageText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  yearBadge: {
    backgroundColor: "#edf2f7",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#cbd5e0",
  },
  yearText: {
    color: "#4a5568",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    color: "#48bb78",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  descriptionSection: {
    marginBottom: 28,
  },
  descriptionTitle: {
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 12,
    color: "#1a202c",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: "#4a5568",
    fontWeight: "500",
  },
  readButton: {
    backgroundColor: "#4299e1",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#4299e1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  readButtonText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
