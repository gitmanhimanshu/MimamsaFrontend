export default {
  expo: {
    name: "Punch",
    slug: "punch",
    extra: {
      API_URL: process.env.API_URL,
      ENV: process.env.ENV,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET
    }
  }
};
