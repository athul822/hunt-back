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

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory with:
   ```
   PORT=8000
   JWT_SECRET=your_strong_secret_key_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   
   # PhonePe Payment Gateway Configuration
   PHONEPE_CLIENT_ID=your_phonepe_client_id
   PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
   PHONEPE_CLIENT_VERSION=1
   PHONEPE_ENV=SANDBOX  # or PRODUCTION for live environment
   
   # PhonePe Merchant Configuration
   MERCHANT_USERNAME=your_dashboard_username
   MERCHANT_PASSWORD=your_dashboard_password
   MERCHANT_REDIRECT_URL=http://localhost:8000/api/payment/success
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

## Mobile App Integration

For React Native integration with Google OAuth:

1. Use Google Sign-In library in your React Native app
2. Send the user's email and Google ID to the API
3. Store the returned JWT token securely using `react-native-keychain`
4. Include the token in all authenticated requests
5. Handle unauthorized responses by prompting for re-authentication

## Payment Gateway Integration

This API integrates with PhonePe's payment gateway for processing payments.

### Payment Endpoints

- `POST /api/payment/initiate` - Initiate a payment transaction
  - Request body: `{ "amount": 100, "userId": "optional_user_id" }`
  - Response: `{ "checkoutUrl": "https://phonepe.com/checkout/...", "orderId": "uuid" }`

- `GET /api/payment/status/:orderId` - Check payment status
  - Response: `{ "status": "PENDING|COMPLETED|FAILED|CANCELLED", "paymentId": "mongodb_id" }`

- `GET /api/payment/success` - Handle redirect from PhonePe after payment
  - Query params: `?orderId=uuid`
  - Response: `{ "success": true, "orderId": "uuid", "status": "COMPLETED|FAILED|CANCELLED", "message": "Payment processed successfully" }`

- `POST /api/payment/callback` - Webhook for PhonePe to notify payment status
  - This endpoint is called by PhonePe and should not be called directly

### PhonePe Integration Flow

1. User initiates payment by calling `/api/payment/initiate` with the amount
2. Backend creates a payment record and calls PhonePe API to get a checkout URL
3. Frontend redirects user to the checkout URL where they complete the payment
4. PhonePe redirects user back to the `MERCHANT_REDIRECT_URL` with the order ID
5. Backend verifies the payment status and updates the database
6. PhonePe also sends a webhook callback to `/api/payment/callback` to confirm the payment status

## Security Best Practices

- Rotate your JWT secret keys periodically
- Always use HTTPS in production
- Keep your dependencies up to date
- Never expose sensitive information in error messages
- Implement proper logging for security events