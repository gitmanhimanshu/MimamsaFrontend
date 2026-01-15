import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { WebView } from "react-native-webview";

export default function PDFViewerScreen({ pdfUrl, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Try multiple PDF viewing methods
  const viewMethods = [
    // Method 1: Direct Cloudinary URL (works for raw PDFs)
    pdfUrl,
    // Method 2: Google Docs Viewer
    `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`,
    // Method 3: Mozilla PDF.js viewer
    `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`
  ];

  const [currentMethod, setCurrentMethod] = useState(0);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const tryNextMethod = () => {
    if (currentMethod < viewMethods.length - 1) {
      setCurrentMethod(currentMethod + 1);
      setError(false);
      setLoading(true);
    } else {
      Alert.alert(
        "Cannot Display PDF",
        "Would you like to open it in your browser?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open in Browser", onPress: () => Linking.openURL(pdfUrl) }
        ]
      );
    }
  };

  const openInBrowser = () => {
    Linking.openURL(pdfUrl);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4299e1" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📄</Text>
          <Text style={styles.errorText}>Failed to load PDF</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={tryNextMethod}>
              <Text style={styles.retryButtonText}>Try Alternative Viewer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.browserButton} onPress={openInBrowser}>
              <Text style={styles.browserButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <WebView
        source={{ uri: viewMethods[currentMethod] }}
        style={styles.webview}
        startInLoadingState={true}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#718096",
    fontWeight: "600",
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    zIndex: 10,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#4a5568",
    fontWeight: "600",
    marginBottom: 30,
  },
  errorButtons: {
    gap: 12,
    width: "100%",
  },
  retryButton: {
    backgroundColor: "#4299e1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  browserButton: {
    backgroundColor: "#48bb78",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  browserButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
