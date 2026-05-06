// src/lib/api.ts
// API service layer for communicating with the backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Authentication API
export const authAPI = {
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials: {
    email: string;
    password: string;
  }) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  adminLogin: (adminKey: string) => apiRequest('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ adminKey }),
  }),

  getProfile: () => apiRequest('/auth/profile'),

  updateProfile: (userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  changePassword: (passwords: {
    currentPassword: string;
    newPassword: string;
  }) => apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(passwords),
  }),

  forgotPassword: (email: string) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  verifyResetCode: (email: string, code: string) => apiRequest('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),

  resetPassword: (email: string, code: string, newPassword: string) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  }),
};

// Rooms API
export const roomsAPI = {
  getRooms: (params?: {
    page?: number;
    limit?: number;
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
    available?: boolean;
    checkIn?: string;
    checkOut?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return apiRequest(`/rooms${query ? `?${query}` : ''}`);
  },

  getRoom: (id: string) => apiRequest(`/rooms/${id}`),

  createRoom: (roomData: {
    name: string;
    description: string;
    price: number;
    capacity: number;
    bedType: string;
    roomType?: string;
    images?: Array<{ url: string; publicId: string; alt?: string }>;
    amenities?: string[];
    size?: number;
    floor?: number;
    view?: string;
    smokingAllowed?: boolean;
    petFriendly?: boolean;
  }) => apiRequest('/rooms', {
    method: 'POST',
    body: JSON.stringify(roomData),
  }),

  updateRoom: (id: string, roomData: Partial<{
    name: string;
    description: string;
    price: number;
    capacity: number;
    bedType: string;
    roomType: string;
    images: Array<{ url: string; publicId: string; alt?: string }>;
    amenities: string[];
    size: number;
    floor: number;
    view: string;
    smokingAllowed: boolean;
    petFriendly: boolean;
    isAvailable: boolean;
  }>) => apiRequest(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(roomData),
  }),

  deleteRoom: (id: string) => apiRequest(`/rooms/${id}`, {
    method: 'DELETE',
  }),

  addRoomImages: (id: string, images: Array<{ url: string; publicId: string; alt?: string }>) => 
    apiRequest(`/rooms/${id}/images`, {
      method: 'POST',
      body: JSON.stringify({ images }),
    }),

  removeRoomImage: (roomId: string, publicId: string) => 
    apiRequest(`/rooms/${roomId}/images/${publicId}`, {
      method: 'DELETE',
    }),

  checkAvailability: (id: string, checkIn: string, checkOut: string) => 
    apiRequest(`/rooms/${id}/availability?checkIn=${checkIn}&checkOut=${checkOut}`),

  getRoomTypes: () => apiRequest('/rooms/types/list'),
};

// Bookings API
export const bookingsAPI = {
  createBooking: (bookingData: {
    roomIds: string[];
    checkIn: string;
    checkOut: string;
    guestInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      specialRequests?: string;
    };
    numberOfGuests: {
      adults: number;
      children?: number;
    };
    specialRequests?: string;
    notes?: string;
  }) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),

  getMyBookings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return apiRequest(`/bookings/my-bookings${query ? `?${query}` : ''}`);
  },

  getBooking: (id: string) => apiRequest(`/bookings/${id}`),

  updateBooking: (id: string, bookingData: {
    guestInfo?: {
      specialRequests?: string;
    };
    notes?: string;
  }) => apiRequest(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bookingData),
  }),

  cancelBooking: (id: string, reason?: string) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  getAllBookings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return apiRequest(`/bookings${query ? `?${query}` : ''}`);
  },

  updateBookingStatus: (id: string, status: string, reason?: string) => 
    apiRequest(`/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    }),

  getBookingStats: () => apiRequest('/bookings/stats/summary'),
};

// Email API
export const emailAPI = {
  sendBookingConfirmation: (bookingId: string, guestEmail: string) => 
    apiRequest('/email/booking-confirmation', {
      method: 'POST',
      body: JSON.stringify({ bookingId, guestEmail }),
    }),

  sendBookingStatus: (data: {
    bookingId: string;
    guestEmail: string;
    status: string;
    subject: string;
    message: string;
  }) => apiRequest('/email/booking-status', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  sendContactForm: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => apiRequest('/email/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  testEmail: () => apiRequest('/email/test', {
    method: 'POST',
  }),
};

// Upload API
export const uploadAPI = {
  uploadImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Upload failed');
    }
    
    return response.json();
  },

  uploadImages: async (imageFiles: File[]) => {
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await fetch(`${API_BASE_URL}/upload/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || 'Upload failed');
    }
    
    return response.json();
  },

  deleteImage: (publicId: string) => apiRequest(`/upload/image/${publicId}`, {
    method: 'DELETE',
  }),

  getImageInfo: (publicId: string) => apiRequest(`/upload/image/${publicId}`),
};

// Config API
export const configAPI = {
  getAboutPage: () => apiRequest('/config/about-page'),
  updateAboutPage: (data: any) => apiRequest('/config/about-page', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
};

// Utility functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Error handling utility
export class APIError extends Error {
  status?: number;
  details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'APIError';
  }
}

// Wrapper function to handle API errors
export async function handleAPIRequest<T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    if (error instanceof APIError) {
      return { data: null, error: error.message };
    }
    if (error instanceof Error) {
      return { data: null, error: error.message };
    }
    return { data: null, error: 'An unexpected error occurred' };
  }
}
