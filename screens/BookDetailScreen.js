import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions, ActivityIndicator, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../constants/theme";
import ReviewModal from "../components/ReviewModal";
import API from "../api";

const { width, height } = Dimensions.get('window');

export default function BookDetailScreen({ book: initialBook, onBack, onNavigate }) {
  // The "book" prop is actually any feed item (book / story / audiobook / video / image).
  // The unified feed uses `type`; the /books/{id}/ detail uses no discriminator at all.
  const contentType = initialBook?.type || initialBook?.content_type || "book";
  const isBook = contentType === "book";

  // The feed returns a slim projection (no `content_url`, no `file_type`, no
  // `price`, etc.). Re-fetch the full record for books so "Read Now" works —
  // mirrors web BookDetail's fetchBookDetails().
  const [book, setBook] = useState(initialBook);

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
  const [loadingReviews, setLoadingReviews] = useState(isBook);

  // Social states
  const [liked, setLiked] = useState(initialBook?.user_liked || false);
  const [saved, setSaved] = useState(initialBook?.user_saved || false);
  const [likeCount, setLikeCount] = useState(initialBook?.like_count || 0);

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

    // Refetch the full record — the feed projection drops fields like
    // `content_url` (book), `audio_url` (audiobook), `content` (short story).
    // Keep social counters from the feed item so the UI doesn't flicker.
    const DETAIL_BY_TYPE = {
      book: "/books/",
      story: "/short-stories/",
      audiobook: "/audiobooks/",
    };
    const detailPath = DETAIL_BY_TYPE[contentType];
    if (detailPath && initialBook?.id) {
      (async () => {
        try {
          const res = await API.get(`${detailPath}${initialBook.id}/`);
          setBook((prev) => ({ ...prev, ...res.data }));
        } catch (err) {
          console.error(`Error fetching ${contentType} details:`, err);
        }
      })();
    }

    // Reviews only exist for books and poems on the backend.
    if (isBook) {
      loadReviews();
    }
  }, []);

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await API.get(`/books/${book.id}/reviews/`);
      const reviewList = Array.isArray(response.data) ? response.data : [];
      setReviews(reviewList);

      // Check if current user has reviewed
      const userId = await getUserId();
      if (userId) {
        const userReviewData = reviewList.find(r => r.user === parseInt(userId));
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
      if (!book.content_url) {
        Alert.alert("Unavailable", "No file is attached to this book yet.");
        return;
      }
      // Use the explicit file_type when available, otherwise sniff the URL.
      const ft = (book.file_type || "").toLowerCase();
      const urlLower = book.content_url.toLowerCase();
      const isInline =
        ft === "pdf" || ft === "epub" ||
        urlLower.includes(".pdf") || urlLower.includes(".epub");

      if (isInline) {
        onNavigate("Reader", { book });
      } else {
        // Other formats (mobi/txt/raw download) — open externally.
        Linking.openURL(book.content_url).catch(() => {
          Alert.alert("Cannot open", "Failed to open this file.");
        });
      }
    }, 200);
  };

  const openAudio = () => {
    animateButton();
    if (!book.audio_url) {
      Alert.alert("Unavailable", "This audiobook has no audio file yet.");
      return;
    }
    // Hand off to the OS — handles direct .mp3 URLs and most streaming hosts.
    Linking.openURL(book.audio_url).catch(() => {
      Alert.alert("Cannot open", "Failed to open this audiobook.");
    });
  };

  const toggleLike = async () => {
    try {
      const userId = await getUserId();
      const newLiked = !liked;
      setLiked(newLiked);
      setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));
      await API.post("/likes/toggle/", {
        user_id: userId,
        content_type: contentType,
        content_id: book.id,
      });
    } catch (error) {
      setLiked(!liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
      console.error("Error toggling like:", error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const userId = await getUserId();
      const newSaved = !saved;
      setSaved(newSaved);
      await API.post("/bookmarks/toggle/", {
        user_id: userId,
        content_type: contentType,
        content_id: book.id,
      });
    } catch (error) {
      setSaved(!saved);
      console.error("Error toggling bookmark:", error);
    }
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
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
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
          {book.cover_image_url ||
          book.cover_image ||
          book.thumbnail_url ||
          book.image_url ||
          book.background_image_url ? (
            <>
              <Image
                source={{
                  uri:
                    book.cover_image_url ||
                    book.cover_image ||
                    book.thumbnail_url ||
                    book.image_url ||
                    book.background_image_url,
                }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <View style={styles.gradientOverlay} />
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book-outline" size={48} color={COLORS.primary} />
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
                <Ionicons name="create-outline" size={16} color={COLORS.primary} style={styles.authorIcon} />
                <Text style={styles.author}>{book.author_name}</Text>
              </View>
            )}
          </View>

          {/* Meta Information */}
          <View style={styles.metaContainer}>
            {book.category_name && (
              <View style={[styles.metaBadge, styles.categoryBadge]}>
                <Ionicons name="folder-outline" size={14} color={COLORS.primary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{book.category_name}</Text>
              </View>
            )}
            {book.genre && (
              <View style={[styles.metaBadge, styles.genreBadge]}>
                <Ionicons name="film-outline" size={14} color={COLORS.primary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{book.genre}</Text>
              </View>
            )}
            {book.language && (
              <View style={[styles.metaBadge, styles.languageBadge]}>
                <Ionicons name="globe-outline" size={14} color={COLORS.primary} style={styles.metaIcon} />
                <Text style={styles.metaText}>{book.language}</Text>
              </View>
            )}
            {book.published_year && (
              <View style={[styles.metaBadge, styles.yearBadge]}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.primary} style={styles.metaIcon} />
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
              <View style={styles.sectionTitleRow}>
                <Ionicons name="book-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>About this book</Text>
              </View>
              <Text style={styles.description}>{book.description}</Text>
            </View>
          )}

          {/* Read Now Button — books only */}
          {isBook && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.readButton}
                onPress={openReader}
                activeOpacity={0.9}
              >
                <View style={styles.readButtonContent}>
                  <Ionicons name={book.is_paid ? "card-outline" : "book-open-outline"} size={22} color={COLORS.white} />
                  <Text style={styles.readButtonText}>
                    {book.is_paid ? "Buy & Read Now" : "Read Now"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Play button — audiobooks only. Opens audio_url externally. */}
          {contentType === "audiobook" && (
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.readButton}
                onPress={openAudio}
                activeOpacity={0.9}
                disabled={!book.audio_url}
              >
                <View style={styles.readButtonContent}>
                  <Ionicons name="play-circle-outline" size={22} color={COLORS.white} />
                  <Text style={styles.readButtonText}>
                    {book.audio_url ? "Play Audiobook" : "No audio available"}
                  </Text>
                  <Ionicons name="headset-outline" size={20} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* For short stories, show the body text. Audiobooks/videos/images
              don't have a `content` field, so this block stays hidden for them. */}
          {!isBook && contentType !== "audiobook" && book.content && (
            <View style={styles.descriptionSection}>
              <Text style={styles.description}>{book.content}</Text>
            </View>
          )}

          {/* Social actions (like / save) — available for every content type */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={toggleLike}
              activeOpacity={0.7}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? "#ef4444" : COLORS.textSecondary}
              />
              <Text style={[styles.socialText, liked && { color: "#ef4444", fontWeight: "700" }]}>
                {likeCount > 0 ? likeCount : "Like"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={toggleBookmark}
              activeOpacity={0.7}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.socialText, saved && { color: COLORS.primary, fontWeight: "700" }]}>
                {saved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* File Type Info */}
          {book.file_type && (
            <View style={styles.fileTypeInfo}>
              <View style={styles.fileTypeRow}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.fileTypeText}>Format: {book.file_type.toUpperCase()}</Text>
              </View>
            </View>
          )}

          {/* Reviews Section — books only (backend reviews are book/poem only) */}
          {isBook && (
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.reviewsTitle}>Reviews & Ratings</Text>
              {book.average_rating > 0 && (
                <View style={styles.averageRating}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.averageRatingText}>{book.average_rating}</Text>
                    <Ionicons name="star" size={14} color="#f59e0b" />
                  </View>
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
              <Ionicons name={userReview ? "create-outline" : "star-outline"} size={18} color={COLORS.primary} />
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
                    <View style={styles.deleteReviewRow}>
                      <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                      <Text style={styles.deleteReviewText}>Delete</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.starsDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={styles.starIcon}>
                      <Ionicons name={star <= userReview.rating ? "star" : "star-outline"} size={18} color="#f59e0b" />
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
                            <Ionicons name={star <= review.rating ? "star" : "star-outline"} size={14} color="#f59e0b" />
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
          )}
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
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: 'rgba(255, 245, 230, 0.7)',
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  socialRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: SPACING.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
});
