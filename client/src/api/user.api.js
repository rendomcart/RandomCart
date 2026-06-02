import axios from './axios';

export const getProfile = () => axios.get('/users/profile');
export const updateProfile = (data) => axios.put('/users/profile', data);
export const updatePassword = (data) => axios.put('/users/password', data);
export const addAddress = (data) => axios.post('/users/addresses', data);
export const updateAddress = (id, data) => axios.put(`/users/addresses/${id}`, data);
export const deleteAddress = (id) => axios.delete(`/users/addresses/${id}`);
export const uploadImage = (formData) => axios.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
