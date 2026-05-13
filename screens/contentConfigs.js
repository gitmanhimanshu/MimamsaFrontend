// Field configs for the generic ManageContentScreen — each entry mirrors the
// matching web admin modal (AddShortStoryModal / AddAudiobookModal / AddVideoModal
// / AddImageModal). Keep field keys aligned with the backend serializer.

const HINDI_LANGUAGES = ["Hindi", "English", "Urdu", "Sanskrit"];

export const SHORT_STORY_CONFIG = {
  label: "Short Stories",
  endpoint: "/short-stories/",
  // Genre values must match backend ShortStory.GENRE_CHOICES.
  genres: [
    { value: "fiction", label: "Fiction" },
    { value: "non_fiction", label: "Non-Fiction" },
    { value: "mystery", label: "Mystery" },
    { value: "romance", label: "Romance" },
    { value: "horror", label: "Horror" },
    { value: "comedy", label: "Comedy" },
    { value: "drama", label: "Drama" },
    { value: "fantasy", label: "Fantasy" },
    { value: "thriller", label: "Thriller" },
  ],
  initialForm: {
    title: "",
    content: "",
    author: "",
    genre: "fiction",
    language: "Hindi",
    cover_image_url: "",
    reading_time: 5,
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "content", label: "Content", type: "textarea", required: true, rows: 8 },
    { name: "author", label: "Author", type: "authorSelect" },
    { name: "genre", label: "Genre", type: "select", optionsKey: "genres" },
    { name: "language", label: "Language", type: "select", options: HINDI_LANGUAGES.map((l) => ({ value: l, label: l })) },
    { name: "reading_time", label: "Reading Time (minutes)", type: "number" },
    { name: "cover_image_url", label: "Cover Image", type: "image" },
  ],
};

export const AUDIOBOOK_CONFIG = {
  label: "Audiobooks",
  endpoint: "/audiobooks/",
  genres: [
    { value: "fiction", label: "Fiction" },
    { value: "non_fiction", label: "Non-Fiction" },
    { value: "biography", label: "Biography" },
    { value: "self_help", label: "Self Help" },
    { value: "business", label: "Business" },
    { value: "history", label: "History" },
    { value: "science", label: "Science" },
    { value: "poetry", label: "Poetry" },
    { value: "drama", label: "Drama" },
  ],
  initialForm: {
    title: "",
    description: "",
    author: "",
    narrator: "",
    genre: "fiction",
    language: "Hindi",
    cover_image_url: "",
    audio_url: "",
    duration: 0,
    is_paid: false,
    price: "",
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", rows: 4 },
    { name: "author", label: "Author", type: "authorSelect" },
    { name: "narrator", label: "Narrator", type: "text" },
    { name: "genre", label: "Genre", type: "select", optionsKey: "genres" },
    { name: "language", label: "Language", type: "select", options: HINDI_LANGUAGES.map((l) => ({ value: l, label: l })) },
    { name: "audio_url", label: "Audio URL", type: "text", required: true, placeholder: "https://example.com/audio.mp3" },
    { name: "duration", label: "Duration (minutes)", type: "number" },
    { name: "cover_image_url", label: "Cover Image", type: "image" },
    { name: "is_paid", label: "Paid Content", type: "switch" },
    { name: "price", label: "Price (₹)", type: "number", showIf: (form) => !!form.is_paid },
  ],
};

export const VIDEO_CONFIG = {
  label: "Videos",
  endpoint: "/videos/",
  // Note: videos use `category` (string key), not genre.
  categories: [
    { value: "literature", label: "Literature" },
    { value: "poetry_reading", label: "Poetry Reading" },
    { value: "author_interview", label: "Author Interview" },
    { value: "book_review", label: "Book Review" },
    { value: "writing_tips", label: "Writing Tips" },
    { value: "storytelling", label: "Storytelling" },
    { value: "documentary", label: "Documentary" },
    { value: "educational", label: "Educational" },
  ],
  initialForm: {
    title: "",
    description: "",
    author: "",
    category: "literature",
    language: "Hindi",
    thumbnail_url: "",
    video_url: "",
    duration: 0,
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", rows: 4 },
    { name: "author", label: "Author", type: "authorSelect" },
    { name: "category", label: "Category", type: "select", optionsKey: "categories" },
    { name: "language", label: "Language", type: "select", options: HINDI_LANGUAGES.map((l) => ({ value: l, label: l })) },
    { name: "video_url", label: "Video URL", type: "text", required: true, placeholder: "https://example.com/video.mp4 or YouTube" },
    { name: "duration", label: "Duration (minutes)", type: "number" },
    { name: "thumbnail_url", label: "Thumbnail Image", type: "image" },
  ],
};

export const IMAGE_CONFIG = {
  label: "Images",
  endpoint: "/images/",
  categories: [
    { value: "book_cover", label: "Book Cover" },
    { value: "author_photo", label: "Author Photo" },
    { value: "illustration", label: "Illustration" },
    { value: "artwork", label: "Artwork" },
    { value: "calligraphy", label: "Calligraphy" },
    { value: "manuscript", label: "Manuscript" },
    { value: "historical", label: "Historical" },
    { value: "cultural", label: "Cultural" },
    { value: "other", label: "Other" },
  ],
  initialForm: {
    title: "",
    description: "",
    author: "",
    category: "other",
    language: "Hindi",
    image_url: "",
    tags: "",
  },
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "description", label: "Description", type: "textarea", rows: 3 },
    { name: "author", label: "Author", type: "authorSelect" },
    { name: "category", label: "Category", type: "select", optionsKey: "categories" },
    { name: "language", label: "Language", type: "select", options: HINDI_LANGUAGES.map((l) => ({ value: l, label: l })) },
    { name: "tags", label: "Tags (comma separated)", type: "text", placeholder: "tag1, tag2, tag3" },
    { name: "image_url", label: "Image", type: "image", required: true },
  ],
};

export const CONTENT_CONFIGS = {
  story: SHORT_STORY_CONFIG,
  audiobook: AUDIOBOOK_CONFIG,
  video: VIDEO_CONFIG,
  image: IMAGE_CONFIG,
};
