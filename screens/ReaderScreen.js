import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get('window');

export default function ReaderScreen({ book, onBack }) {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const fileUrl = book.content_url || "";
  const isEpub = fileUrl.toLowerCase().includes('.epub');
  const isPdf = fileUrl.toLowerCase().includes('.pdf');
  
  // Create HTML with PDF.js viewer for better mobile experience
  const createPDFViewerHTML = (url) => {
    // Use direct Cloudinary URL
    let pdfUrl = url;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #1a1a1a;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #viewer-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #1a1a1a;
        }
        #pdf-canvas {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: #2a2a2a;
          padding: 10px;
        }
        canvas {
          max-width: 100%;
          height: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          background: white;
        }
        #controls {
          background: #1a1a1a;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #333;
        }
        button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        button:active {
          background: #3182ce;
          transform: scale(0.95);
        }
        button:disabled {
          background: #555;
          opacity: 0.5;
        }
        #page-info {
          color: #fff;
          font-size: 16px;
          font-weight: 500;
        }
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 18px;
          text-align: center;
        }
        .spinner {
          border: 4px solid #333;
          border-top: 4px solid #4299e1;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        #error-msg {
          display: none;
          color: #ff6b6b;
          padding: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div id="viewer-container">
        <div id="pdf-canvas">
          <div id="loading">
            <div class="spinner"></div>
            <div>Loading PDF...</div>
          </div>
          <div id="error-msg"></div>
          <canvas id="the-canvas"></canvas>
        </div>
        <div id="controls">
          <button id="prev-btn" disabled>← Previous</button>
          <span id="page-info">
            <span id="page-num">1</span> / <span id="page-count">--</span>
          </span>
          <button id="next-btn" disabled>Next →</button>
        </div>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script>
        const url = '${pdfUrl}';
        let pdfDoc = null;
        let pageNum = 1;
        let pageRendering = false;
        let pageNumPending = null;
        const scale = 1.5;
        const canvas = document.getElementById('the-canvas');
        const ctx = canvas.getContext('2d');
        const loading = document.getElementById('loading');
        const errorMsg = document.getElementById('error-msg');

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        function renderPage(num) {
          pageRendering = true;
          pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({scale: scale});
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            renderTask.promise.then(function() {
              pageRendering = false;
              loading.style.display = 'none';
              if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
              }
            });
          });

          document.getElementById('page-num').textContent = num;
        }

        function queueRenderPage(num) {
          if (pageRendering) {
            pageNumPending = num;
          } else {
            renderPage(num);
          }
        }

        function onPrevPage() {
          if (pageNum <= 1) return;
          pageNum--;
          queueRenderPage(pageNum);
          window.ReactNativeWebView.postMessage(JSON.stringify({page: pageNum}));
        }

        function onNextPage() {
          if (pageNum >= pdfDoc.numPages) return;
          pageNum++;
          queueRenderPage(pageNum);
          window.ReactNativeWebView.postMessage(JSON.stringify({page: pageNum}));
        }

        document.getElementById('prev-btn').addEventListener('click', onPrevPage);
        document.getElementById('next-btn').addEventListener('click', onNextPage);

        // Load PDF with proper settings for Cloudinary
        pdfjsLib.getDocument({
          url: url,
          withCredentials: false,
          isEvalSupported: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true
        }).promise.then(function(pdfDoc_) {
          pdfDoc = pdfDoc_;
          document.getElementById('page-count').textContent = pdfDoc.numPages;
          
          document.getElementById('prev-btn').disabled = false;
          document.getElementById('next-btn').disabled = false;
          
          renderPage(pageNum);
          
          // Send success message
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true, 
            pages: pdfDoc.numPages
          }));
        }).catch(function(error) {
          console.error('PDF load error:', error);
          loading.style.display = 'none';
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = '<div style="color: #ff6b6b; font-size: 18px; font-weight: 600;">⚠️ Failed to load PDF</div><div style="color: #aaa; margin-top: 10px; font-size: 14px;">The file might be corrupted or not accessible</div>';
          
          // Send error message
          window.ReactNativeWebView.postMessage(JSON.stringify({
            error: true, 
            message: error.message
          }));
        });
      </script>
    </body>
    </html>
  `;
  };

  // EPUB viewer HTML
  const createEPUBViewerHTML = (url) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #1a1a1a;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #viewer {
          width: 100vw;
          height: 100vh;
        }
        #loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div id="loading">Loading EPUB...</div>
      <div id="viewer"></div>
      <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
      <script>
        const book = ePub('${url}');
        const rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100%",
          spread: "none"
        });
        
        rendition.display().then(() => {
          document.getElementById('loading').style.display = 'none';
        });

        document.addEventListener('click', function(e) {
          const x = e.clientX;
          if (x < window.innerWidth / 2) {
            rendition.prev();
          } else {
            rendition.next();
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.page) {
        setCurrentPage(data.page);
      }
    } catch (e) {
      console.log("Message parse error:", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.headerSubtitle}>
            {book.author_name || "Unknown Author"}
          </Text>
        </View>
        <View style={styles.fileTypeBadge}>
          <Text style={styles.fileTypeText}>
            {isPdf ? "PDF" : isEpub ? "EPUB" : "eBook"}
          </Text>
        </View>
      </View>

      {/* Reader */}
      {fileUrl ? (
        <View style={styles.readerContainer}>
          <WebView
            source={{ 
              html: isPdf ? createPDFViewerHTML(fileUrl) : createEPUBViewerHTML(fileUrl)
            }}
            style={styles.webview}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            mixedContentMode="always"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>📚</Text>
          <Text style={styles.errorText}>No file available</Text>
          <Text style={styles.errorSubtext}>Please upload a PDF or EPUB file</Text>
          <TouchableOpacity style={styles.errorButton} onPress={onBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "#1a1a1a",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 3,
  },
  headerSubtitle: {
    color: "#999",
    fontSize: 13,
  },
  fileTypeBadge: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fileTypeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  readerContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 30,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  errorSubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
