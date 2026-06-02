import axios from './axios';

export const uploadImage = (formData) => axios.post('/upload', formData);
