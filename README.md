# Tourism API Backend

A secure backend API for the tourism mobile application, built with Express.js.

## Security Features

This API implements several security features:

- **JWT Authentication**: Secure token-based authentication system.
- **Google OAuth Integration**: Works with Google OAuth from the mobile app.
- **Helmet Security Headers**: HTTP headers secured with Helmet.
- **Rate Limiting**: Prevents abuse through API request limiting.
- **CORS Configuration**: Configured for secure cross-origin requests.
- **Role-Based Access Control**: Different access levels for users and admins.
- **Input Validation**: Prevents malicious inputs.
- **Coin Transaction Security**: Multiple layers of security for financial transactions.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory with:
   ```
   PORT=8000
   JWT_SECRET=your_strong_secret_key_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```
4. Run the development server: `npm run dev`

## API Authentication

The API is designed to work with Google OAuth authentication from the mobile app. The mobile app handles the Google authentication process and sends the user details to the API.

### 1. User Registration/Login with Google OAuth

```
POST /api/user/register
Content-Type: application/json

{
  "email": "user@example.com",
  "googleId": "google-oauth2-id",
  "firstName": "John",
  "lastName": "Doe"
}
```

The response will include a JWT token:
```
{
  "message": "User registration successful",
  "token": "your_jwt_token_here",
  "user": { ... }
}
```

### 2. Login with Google OAuth

```
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "googleId": "google-oauth2-id"
}
```

The response will include a JWT token:
```
{
  "message": "Login successful",
  "token": "your_jwt_token_here",
  "user": { ... }
}
```

### 3. Authenticated Requests

Include the token in the Authorization header for all protected endpoints:

```
GET /api/user/me
Authorization: Bearer your_jwt_token_here
```

## Protected Routes

- `/api/user/me` - Get current user profile
- `/api/user/update/:id` - Update user details
- `/api/places/register` - Create a new place
- `/api/places/createContest` - Create a contest

## Admin Only Routes

- `/api/places/delete` - Delete places
- `/api/coins/admin/give` - Admin can give coins to users

## Coin System

The API includes a secure in-app coin system for monetization:

### User Routes

- `GET /api/coins/balance` - Get user's current coin balance
- `GET /api/coins/transactions` - Get user's transaction history with pagination

### Recharge Routes

- `POST /api/coins/recharge/initiate` - Initiate a coin recharge
  ```
  Content-Type: application/json
  X-CSRF-Token: your_csrf_token
  Authorization: Bearer your_jwt_token_here
  
  {
    "amount": 100  // Amount to recharge
  }
  ```

- `POST /api/coins/recharge/complete` - Complete a pending recharge
  ```
  Content-Type: application/json
  X-CSRF-Token: your_csrf_token
  Authorization: Bearer your_jwt_token_here
  
  {
    "transactionId": "transaction_id_here",
    "paymentId": "payment_id_here"
  }
  ```

### Spending Routes

- `POST /api/coins/spend` - Spend coins on items/services
  ```
  Content-Type: application/json
  X-CSRF-Token: your_csrf_token
  Authorization: Bearer your_jwt_token_here
  
  {
    "amount": 50,
    "itemId": "item_id_here",
    "itemType": "place_unlock"
  }
  ```

### Admin Routes

- `POST /api/coins/admin/give` - Give coins to a user (admin only)
  ```
  Content-Type: application/json
  X-CSRF-Token: your_csrf_token
  Authorization: Bearer your_jwt_token_here
  
  {
    "userId": "user_id_here",
    "amount": 200,
    "reason": "Contest prize"
  }
  ```

### Coin System Security

The coin system implements multiple layers of security:

1. **Transaction Validation**: All inputs strictly validated
2. **Rate Limiting**: Strict limits on transaction endpoints
3. **CSRF Protection**: CSRF tokens required for all transactions
4. **Transaction Ownership Verification**: Users can only access their own transactions
5. **Duplicate Processing Prevention**: Prevents same transaction from being processed twice
6. **MongoDB Transactions**: Ensures data consistency with atomic operations
7. **Audit Logging**: Detailed logs of all coin-related operations
8. **Role-Based Permissions**: Only admins can perform certain operations

## Mobile App Integration

For React Native integration with Google OAuth:

1. Use Google Sign-In library in your React Native app
2. Send the user's email and Google ID to the API
3. Store the returned JWT token securely using `react-native-keychain`
4. Include the token in all authenticated requests
5. Handle unauthorized responses by prompting for re-authentication

## Security Best Practices

- Rotate your JWT secret keys periodically
- Always use HTTPS in production
- Keep your dependencies up to date
- Never expose sensitive information in error messages
- Implement proper logging for security events 