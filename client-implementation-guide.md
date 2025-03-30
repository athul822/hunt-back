# JWT Authentication Implementation Guide for React Native

This guide explains how to implement the JWT authentication with refresh tokens in your React Native app.

## Overview of the Authentication Flow

1. User logs in via Google OAuth
2. Backend returns an `access token` and a `refresh token`
3. The access token is short-lived (7 days) and is used for authenticated requests
4. The refresh token is long-lived (30 days) and is used to get a new access token when it expires
5. When the access token expires, the app uses the refresh token to get a new access token without requiring the user to log in again

## Setup and Implementation

### 1. Install Required Packages

```bash
npm install @react-native-async-storage/async-storage axios jwt-decode
# or
yarn add @react-native-async-storage/async-storage axios jwt-decode
```

### 2. Token Storage

Create a token storage utility:

```javascript
// utils/tokenStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const storeTokens = async (accessToken, refreshToken) => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    return true;
  } catch (error) {
    console.error('Error storing tokens:', error);
    return false;
  }
};

export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing tokens:', error);
    return false;
  }
};
```

### 3. API Client with Token Refresh

Create an API client with automatic token refresh capability:

```javascript
// api/client.js
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from '../utils/tokenStorage';

const API_URL = 'https://your-api-url.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    let token = await getAccessToken();
    
    // Check if token exists and is not expired
    if (token && !isTokenExpired(token)) {
      config.headers['Authorization'] = `Bearer ${token}`;
      return config;
    }
    
    // If token is expired, try to refresh it
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      // No refresh token, clear tokens and user will need to login again
      await clearTokens();
      return config;
    }
    
    try {
      // Call refresh token endpoint
      const response = await axios.post(`${API_URL}/user/refresh-token`, {
        refreshToken,
      });
      
      // Store new tokens
      const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
      await storeTokens(newAccessToken, newRefreshToken);
      
      // Add the new access token to the request
      config.headers['Authorization'] = `Bearer ${newAccessToken}`;
      return config;
    } catch (error) {
      // If refresh token is invalid, clear tokens and user will need to login again
      await clearTokens();
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 4. Authentication Service

Create a service to handle authentication:

```javascript
// services/authService.js
import apiClient from '../api/client';
import { storeTokens, clearTokens } from '../utils/tokenStorage';

export const loginWithGoogle = async (googleAuthResponse) => {
  try {
    const { email, id: googleId, givenName: firstName, familyName: lastName, photoUrl: profileImage } = googleAuthResponse.user;
    
    const response = await apiClient.post('/user/google-auth', {
      email,
      googleId,
      firstName,
      lastName,
      profileImage
    });
    
    const { token, refreshToken, user } = response.data;
    
    // Store tokens
    await storeTokens(token, refreshToken);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Google login error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to login with Google',
    };
  }
};

export const logout = async () => {
  try {
    const refreshToken = await getRefreshToken();
    
    if (refreshToken) {
      // Call logout endpoint
      await apiClient.post('/user/logout', { refreshToken });
    }
    
    // Clear tokens from storage
    await clearTokens();
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Logout error:', error);
    // Even if the API call fails, clear the tokens
    await clearTokens();
    
    return {
      success: true,
    };
  }
};
```

### 5. Using the Authentication in Components

Example Login Screen:

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loginWithGoogle } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Sign in with Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Login to our backend with Google credentials
      const result = await loginWithGoogle(userInfo);
      
      if (result.success) {
        // Navigate to home screen
        navigation.replace('Home');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button title="Sign in with Google" onPress={handleGoogleLogin} />
          {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
        </>
      )}
    </View>
  );
};

export default LoginScreen;
```

Example for making authenticated API calls:

```javascript
// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import apiClient from '../api/client';
import { logout } from '../services/authService';

const HomeScreen = ({ navigation }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      // This api call will automatically handle token refresh if needed
      const response = await apiClient.get('/places');
      setPlaces(response.data.places);
    } catch (error) {
      console.error('Error fetching places:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };
  
  useEffect(() => {
    fetchPlaces();
  }, []);
  
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Logout" onPress={handleLogout} />
      
      {loading ? (
        <Text>Loading places...</Text>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text>{item.name}</Text>
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;
```

## Best Practices

1. **Token Security**: Store tokens in secure storage. For production apps, consider using `react-native-keychain` instead of AsyncStorage for better security.

2. **Background Processing**: If your app has background processing, make sure to refresh tokens as needed.

3. **Error Handling**: Implement proper error handling for both expired tokens and refresh failures.

4. **Token Persistence**: Clear tokens when the user logs out or when refreshing fails.

5. **Test Expiration**: Test the token expiration and refresh mechanism by setting shorter expiration times during development.

By following this implementation guide, your React Native app will have a robust JWT authentication system with refresh tokens, providing a seamless user experience even with token expiration. 