import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get('window');

export default function ReaderScreen({ book, onBack }) {
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  
  const fileUrl = book.content_url || "";
  const isEpub = fileUrl.toLowerCase().includes('.epub');
  const isPdf = fileUrl.toLowerCase().includes('.pdf');
  
  // Create HTML with PDF.js viewer - ALL PAGES SCROLLABLE
  const createPDFViewerHTML = (url) => {
    let pdfUrl = url;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #2a2a2a;
          overflow-y: scroll;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        #viewer-container {
          width: 100%;
          min-height: 100vh;
          background: #2a2a2a;
          padding: 20px 10px;
        }
        #pages-container {
          width: 100%;
          max-width: 100%;
        }
        .pdf-page {
          margin: 0 auto 20px;
          display: block;
          width: 100%;
          max-width: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          background: white;
        }
        #loading {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 18px;
          text-align: center;
          z-index: 10;
          background: rgba(0,0,0,0.8);
          padding: 30px;
          border-radius: 15px;
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
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.9);
          border-radius: 15px;
          max-width: 80%;
        }
        #page-indicator {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(66, 153, 225, 0.9);
          color: white;
          padding: 8px 15px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          z-index: 100;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="loading">
        <div class="spinner"></div>
        <div>Loading PDF...</div>
      </div>
      <div id="error-msg"></div>
      <div id="page-indicator" style="display: none;">Page 1 / --</div>
      <div id="viewer-container">
        <div id="pages-container"></div>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script>
        const url = '${pdfUrl}';
        const scale = 2.0; // Good scale for mobile
        const loading = document.getElementById('loading');
        const errorMsg = document.getElementById('error-msg');
        const pagesContainer = document.getElementById('pages-container');
        const pageIndicator = document.getElementById('page-indicator');

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // Track scroll position to show current page
        let currentVisiblePage = 1;
        let totalPages = 0;

        function updatePageIndicator() {
          const canvases = document.querySelectorAll('.pdf-page');
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const windowHeight = window.innerHeight;
          
          for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const rect = canvas.getBoundingClientRect();
            
            // Check if canvas is in viewport
            if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
              currentVisiblePage = i + 1;
              pageIndicator.textContent = 'Page ' + currentVisiblePage + ' / ' + totalPages;
              break;
            }
          }
        }

        // Render all pages
        async function renderAllPages(pdfDoc) {
          totalPages = pdfDoc.numPages;
          pageIndicator.textContent = 'Page 1 / ' + totalPages;
          pageIndicator.style.display = 'block';
          
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({scale: scale});
            
            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page';
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            pagesContainer.appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            await page.render({
              canvasContext: ctx,
              viewport: viewport
            }).promise;
            
            // Update loading text
            loading.querySelector('div:last-child').textContent = 'Loading page ' + pageNum + ' of ' + pdfDoc.numPages;
          }
          
          loading.style.display = 'none';
          
          // Send success message
          window.ReactNativeWebView.postMessage(JSON.stringify({
            success: true, 
            pages: pdfDoc.numPages
          }));
        }

        // Load PDF
        pdfjsLib.getDocument({
          url: url,
          withCredentials: false,
          isEvalSupported: false,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true
        }).promise.then(function(pdfDoc) {
          renderAllPages(pdfDoc);
        }).catch(function(error) {
          console.error('PDF load error:', error);
          loading.style.display = 'none';
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = '<div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">⚠️ Failed to load PDF</div><div style="color: #aaa; font-size: 14px;">The file might be corrupted or not accessible</div>';
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            error: true, 
            message: error.message
          }));
        });

        // Update page indicator on scroll
        window.addEventListener('scroll', updatePageIndicator);
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
      if (data.pages) {
        setTotalPages(data.pages);
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
