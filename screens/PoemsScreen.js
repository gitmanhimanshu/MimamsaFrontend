import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator } from "react-native";
import API from "../api";
import ReviewModal from "../components/ReviewModal";

const { width } = Dimensions.get('window');

export default function PoemsScreen({ onBack, userId }) {
  const [categories, setCategories] = useState([]);
  const [poems, setPoems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Review states
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPoem) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      loadReviews();
    }
  }, [selectedPoem]);

  const loadData = async () => {
    try {
      const [categoriesRes, poemsRes] = await Promise.all([
        API.get("/poem-categories/"),
        API.get("/poems/")
      ]);
      setCategories(categoriesRes.data);
      setPoems(poemsRes.data);
    } catch (err) {
      console.error("Error loading poems:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterPoems = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedPoem(null);
  };

  const getUserId = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userJson = await AsyncStorage.getItem('@user_session');
      if (userJson) {
        const userData = JSON.parse(userJson);
        return userData.id;
      }
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
    return null;
  };

  const loadReviews = async () => {
    if (!selectedPoem) return;
    
    try {
      setLoadingReviews(true);
      const response = await API.get(`/poems/${selectedPoem.id}/reviews/`);
      setReviews(response.data);
      
      // Check if current user has reviewed
      const currentUserId = await getUserId();
      if (currentUserId) {
        const userReviewData = response.data.find(r => r.user === parseInt(currentUserId));
        setUserReview(userReviewData || null);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      setReviewLoading(true);
      const currentUserId = await getUserId();
      
      await API.post(`/poems/${selectedPoem.id}/reviews/`, {
        user_id: currentUserId,
        rating,
        comment
      });
      
      setShowReviewModal(false);
      loadReviews();
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    try {
      const currentUserId = await getUserId();
      await API.delete(`/poems/${selectedPoem.id}/reviews/user/`, {
        data: { user_id: currentUserId }
      });
      
      setUserReview(null);
      loadReviews();
      alert("Review deleted successfully!");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const getFilteredPoems = () => {
    if (!selectedCategory) return poems;
    return poems.filter(p => p.category === selectedCategory);
  };

  if (selectedPoem) {
    return (
      <View style={styles.container}>
        {/* Poem Detail View */}
        <View style={styles.poemHeader}>
          <TouchableOpacity 
            onPress={() => {
              fadeAnim.setValue(0);
              setSelectedPoem(null);
            }} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.poemHeaderTitle} numberOfLines={1}>
            {selectedPoem?.title || ""}
          </Text>
        </View>

        <Animated.ScrollView 
          style={[styles.poemDetailContainer, { opacity: fadeAnim }]}
          contentContainerStyle={styles.poemDetailContent}
        >
          <View style={styles.poemTitleSection}>
            <Text style={styles.poemTitle}>{selectedPoem?.title || ""}</Text>
            <View style={styles.poemMeta}>
              {(selectedPoem?.author_name && selectedPoem.author_name.trim() !== "") ? (
                <View style={styles.authorInfoDetail}>
                  <Text style={styles.writtenByLabel}>Written by</Text>
                  <Text style={styles.authorNameDetail}>{selectedPoem.author_name}</Text>
                </View>
              ) : (
                <View style={styles.authorInfoDetail}>
                  <Text style={styles.authorNameDetail}>Anonymous</Text>
                </View>
              )}
              {(selectedPoem?.category_icon && selectedPoem.category_icon.trim() !== "") && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>{selectedPoem.category_icon}</Text>
                  <Text style={styles.metaText}>{selectedPoem?.category_name || ""}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.poemContentSection}>
            <Text style={styles.poemContent}>{selectedPoem?.content || ""}</Text>
          </View>

          <View style={styles.poemFooter}>
            <Text style={styles.footerText}>
              {selectedPoem?.created_at ? new Date(selectedPoem.created_at).toLocaleDateString('hi-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : ""}
            </Text>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Reviews & Ratings</Text>
              {(selectedPoem?.average_rating > 0) && (
                <View style={styles.averageRating}>
                  <Text style={styles.averageRatingText}>
                    {selectedPoem.average_rating} ★
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({selectedPoem.review_count || 0})
                  </Text>
                </View>
              )}
            </View>

            {/* Write Review Button */}
            <TouchableOpacity
              style={styles.writeReviewButton}
              onPress={() => setShowReviewModal(true)}
            >
              <Text style={styles.writeReviewIcon}>
                {userReview ? "✏️" : "⭐"}
              </Text>
              <Text style={styles.writeReviewText}>
                {userReview ? "Edit Your Review" : "Write a Review"}
              </Text>
            </TouchableOpacity>

            {/* User's Review */}
            {userReview && (
              <View style={styles.userReviewCard}>
                <View style={styles.userReviewHeader}>
                  <Text style={styles.yourReviewLabel}>Your Review</Text>
                  <TouchableOpacity onPress={handleDeleteReview}>
                    <Text style={styles.deleteReviewText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.starsDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={styles.starIcon}>
                      {star <= userReview.rating ? "★" : "☆"}
                    </Text>
                  ))}
                </View>
                {userReview.comment && (
                  <Text style={styles.reviewComment}>{userReview.comment}</Text>
                )}
              </View>
            )}

            {/* All Reviews */}
            {loadingReviews ? (
              <ActivityIndicator size="small" color="#4299e1" style={{ marginTop: 20 }} />
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                <Text style={styles.allReviewsTitle}>
                  All Reviews ({reviews.length})
                </Text>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.user_name}</Text>
                      <View style={styles.starsDisplay}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text key={star} style={styles.starIconSmall}>
                            {star <= review.rating ? "★" : "☆"}
                          </Text>
                        ))}
                      </View>
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to review!
              </Text>
            )}
          </View>
        </Animated.ScrollView>

        {/* Review Modal */}
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          existingReview={userReview}
          loading={reviewLoading}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>कविताएँ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>श्रेणियाँ</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive
              ]}
              onPress={() => filterPoems(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive
              ]}>
                सभी
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive
                ]}
                onPress={() => filterPoems(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive
                ]}>
                  {cat.name}
                </Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{String(cat.poems_count || 0)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Poems List */}
        <View style={styles.poemsSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory 
              ? (categories.find(c => c.id === selectedCategory)?.name || 'कविताएँ')
              : 'सभी कविताएँ'}
          </Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : getFilteredPoems().length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>कोई कविता नहीं मिली</Text>
            </View>
          ) : (
            getFilteredPoems().map((poem, index) => (
              <TouchableOpacity
                key={poem.id}
                style={[
                  styles.poemCard,
                  { 
                    transform: [{ 
                      translateY: new Animated.Value(50 * (index % 3)).interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, 0]
                      })
                    }]
                  }
                ]}
                onPress={() => setSelectedPoem(poem)}
                activeOpacity={0.8}
              >
                <View style={styles.poemCardHeader}>
                  <Text style={styles.poemCardTitle} numberOfLines={2}>
                    {poem.title}
                  </Text>
                  {(poem.category_icon && poem.category_icon.trim() !== "") && (
                    <Text style={styles.poemCardIcon}>{poem.category_icon}</Text>
                  )}
                </View>
                <Text style={styles.poemCardPreview} numberOfLines={3}>
                  {poem.content}
                </Text>
                <View style={styles.poemCardFooter}>
                  {(poem.author_name && poem.author_name.trim() !== "") ? (
                    <View style={styles.authorInfo}>
                      <Text style={styles.writtenByText}>Written by</Text>
                      <Text style={styles.poemCardAuthor}>{poem.author_name}</Text>
                    </View>
                  ) : (
                    <View style={styles.authorInfo}>
                      <Text style={styles.poemCardAuthor}>Anonymous</Text>
                    </View>
                  )}
                  <Text style={styles.poemCardDate}>
                    {new Date(poem.created_at).toLocaleDateString('hi-IN')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  categoriesSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  categoriesScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: "#4299e1",
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryChipText: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  categoryBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  poemsSection: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  poemCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  poemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  poemCardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  poemCardIcon: {
    fontSize: 24,
  },
  poemCardPreview: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  poemCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  authorInfo: {
    flex: 1,
  },
  writtenByText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  poemCardAuthor: {
    color: "#4299e1",
    fontSize: 14,
    fontWeight: "700",
  },
  poemCardDate: {
    color: "#666",
    fontSize: 12,
  },
  loadingText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  // Poem Detail Styles
  poemHeader: {
    backgroundColor: "#1a1a1a",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  poemHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginLeft: 15,
  },
  poemDetailContainer: {
    flex: 1,
  },
  poemDetailContent: {
    padding: 20,
    paddingBottom: 100,
  },
  poemTitleSection: {
    marginBottom: 30,
  },
  poemTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 15,
    lineHeight: 36,
  },
  poemMeta: {
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
  },
  authorInfoDetail: {
    marginBottom: 5,
  },
  writtenByLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  authorNameDetail: {
    color: "#4299e1",
    fontSize: 16,
    fontWeight: "700",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    color: "#4299e1",
    fontSize: 14,
    fontWeight: "600",
  },
  poemContentSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  poemContent: {
    color: "#e0e0e0",
    fontSize: 16,
    lineHeight: 28,
    fontFamily: "serif",
  },
  poemFooter: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  footerText: {
    color: "#666",
    fontSize: 13,
  },
  // Review Styles
  reviewsSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: "#fff",
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  averageRatingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  writeReviewIcon: {
    fontSize: 20,
  },
  writeReviewText: {
    color: '#4299e1',
    fontSize: 16,
    fontWeight: '600',
  },
  userReviewCard: {
    backgroundColor: '#1a3a4a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4299e1',
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  yourReviewLabel: {
    color: '#4299e1',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteReviewText: {
    color: '#f56565',
    fontSize: 14,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  starIcon: {
    fontSize: 20,
    color: '#FFD700',
  },
  starIconSmall: {
    fontSize: 16,
    color: '#FFD700',
  },
  reviewComment: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  reviewsList: {
    marginTop: 10,
  },
  allReviewsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: "#fff",
    marginBottom: 15,
  },
  reviewCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: '600',
  },
  reviewDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
  },
  noReviewsText: {
    color: "#666",
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
