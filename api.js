import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.1.22:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Cloudinary Upload Functions
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    "http://192.168.1.22:8000/api/upload/image/",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    "http://192.168.1.22:8000/api/upload/pdf/",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const uploadText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    "http://192.168.1.22:8000/api/upload/text/",
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export default API;