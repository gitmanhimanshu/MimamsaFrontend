import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import ReviewModal from "../components/ReviewModal";
import API from "../api";

const { width, height } = Dimensions.get('window');

export default function BookDetailScreen({ book, onBack, onNavigate }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Review states
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load reviews
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await API.get(`/books/${book.id}/reviews/`);
      setReviews(response.data);
      
      // Check if current user has reviewed
      const userId = await getUserId();
      if (userId) {
        const userReviewData = response.data.find(r => r.user === parseInt(userId));
        setUserReview(userReviewData || null);
      }
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
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

  const handleSubmitReview = async ({ rating, comment }) => {
    try {
      setReviewLoading(true);
      const userId = await getUserId();
      
      await API.post(`/books/${book.id}/reviews/`, {
        user_id: userId,
        rating,
        comment
      });
      
      setShowReviewModal(false);
      loadReviews(); // Reload reviews
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
      const userId = await getUserId();
      await API.delete(`/books/${book.id}/reviews/user/`, {
        data: { user_id: userId }
      });
      
      setUserReview(null);
      loadReviews();
      alert("Review deleted successfully!");
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openReader = () => {
    animateButton();
    setTimeout(() => {
      if (book.content_url) {
        const url = book.content_url.toLowerCase();
        if (url.includes('.pdf') || url.includes('.epub')) {
          onNavigate("Reader", { book });
        } else {
          alert("Opening file in browser...");
        }
      } else {
        alert("No file available to read");
      }
    }, 200);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Back Button */}
        <Animated.View 
          style={[
            styles.backButtonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Cover Image with Gradient Overlay */}
        <Animated.View 
          style={[
            styles.coverContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {book.cover_image_url ? (
            <>
              <Image 
                source={{ uri: book.cover_image_url }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.gradientOverlay} />
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.placeholderIcon}>📚</Text>
              <Text style={styles.placeholderText}>No Cover</Text>
            </View>
          )}
        </Animated.View>

        {/* Content Card */}
        <Animated.View 
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Title & Author */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{book.title}</Text>
            
            {book.author_name && (
              <View style={styles.authorRow}>
                <Text style={styles.authorIcon}>✍️</Text>
                <Text style={styles.author}>{book.author_name}</Text>
              </View>
            )}
          </View>

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            {book.category_name && (
              <View style={[styles.metaBadge, styles.categoryBadge]}>
                <Text style={styles.metaIcon}>📂</Text>
                <Text style={styles.metaText}>{book.category_name}</Text>
              </View>
            )}
            {book.genre && (
              <View style={[styles.metaBadge, styles.genreBadge]}>
                <Text style={styles.metaIcon}>🎭</Text>
                <Text style={styles.metaText}>{book.genre}</Text>
              </View>
            )}
            {book.language && (
              <View style={[styles.metaBadge, styles.languageBadge]}>
                <Text style={styles.metaIcon}>🌐</Text>
                <Text style={styles.metaText}>{book.language}</Text>
              </View>
            )}
            {book.published_year && (
              <View style={[styles.metaBadge, styles.yearBadge]}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>{book.published_year}</Text>
              </View>
            )}
          </View>

          {/* Price */}
          {book.is_paid && book.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.price}>₹{book.price}</Text>
            </View>
          )}

          {/* Description */}
          {book.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>📖 About this book</Text>
              <Text style={styles.description}>{book.description}</Text>
            </View>
          )}

          {/* Read Now Button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={styles.readButton}
              onPress={openReader}
              activeOpacity={0.9}
            >
              <View style={styles.readButtonContent}>
                <Text style={styles.readButtonIcon}>
                  {book.is_paid ? "💳" : "📖"}
                </Text>
                <Text style={styles.readButtonText}>
                  {book.is_paid ? "Buy & Read Now" : "Read Now"}
                </Text>
                <Text style={styles.readButtonArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* File Type Info */}
          {book.file_type && (
            <View style={styles.fileTypeInfo}>
              <Text style={styles.fileTypeText}>
                📄 Format: {book.file_type.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Reviews & Ratings</Text>
              {book.average_rating > 0 && (
                <View style={styles.averageRating}>
                  <Text style={styles.averageRatingText}>
                    {book.average_rating} ★
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({book.review_count} {book.review_count === 1 ? 'review' : 'reviews'})
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
        </Animated.View>

        {/* Review Modal */}
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          existingReview={userReview}
          loading={reviewLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backButtonIcon: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
  },
  coverContainer: {
    width: width,
    height: height * 0.55,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 100,
    marginBottom: SPACING.md,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
  },
  contentCard: {
    backgroundColor: COLORS.background,
    marginTop: -50,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    minHeight: height * 0.5,
  },
  headerSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  authorIcon: {
    fontSize: 20,
  },
  author: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.sm,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
  },
  genreBadge: {
    backgroundColor: COLORS.accent,
  },
  languageBadge: {
    backgroundColor: COLORS.success,
  },
  yearBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.card,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  priceContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    ...SHADOWS.md,
  },
  priceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: -1,
  },
  descriptionSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
  readButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  readButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  readButtonIcon: {
    fontSize: 24,
  },
  readButtonText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  readButtonArrow: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '700',
  },
  fileTypeInfo: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  fileTypeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  // Review Styles
  reviewsSection: {
    marginTop: 30,
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
    color: COLORS.white,
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
    color: COLORS.textMuted,
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
    color: COLORS.textSecondary,
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
    color: COLORS.white,
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
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  reviewDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  noReviewsText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
