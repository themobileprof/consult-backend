# Booking API Documentation

## Base URL
`http://localhost:4000`

---

## POST /api/bookings
Create a new booking.

### Request
- **Content-Type:** application/json
- **Body Example:**
  ```json
  {
    "date": "2025-05-28",
    "time": "10:00 AM",
    "endTime": "12:00 PM", // optional for paid bookings
    "type": "free" | "paid",
    "cost": "$150" // or "Free",
    "email": "user@example.com"
  }
  ```
- **Required fields:**
  - `date` (string, required)
  - `time` (string, required)
  - `type` (string, required: "free" or "paid")
  - `email` (string, required)
- **Optional fields:**
  - `endTime` (string, for paid bookings)
  - `cost` (string)

### Response
- **Success (201):**
  ```json
  {
    "message": "Booking received",
    "booking": {
      "id": 1,
      "date": "2025-05-28",
      "time": "10:00 AM",
      "endTime": "12:00 PM",
      "type": "paid",
      "cost": "$150",
      "email": "user@example.com",
      "createdAt": "2025-05-28T12:34:56.789Z"
    }
  }
  ```
- **Error (400):**
  ```json
  { "error": "Missing required fields" }
  ```
- **Error (403):**
  ```json
  { "error": "User has already used free consultation" }
  ```

---

## GET /api/bookings
Get all bookings (for testing/development).

### Response
- **Success (200):**
  ```json
  [
    {
      "id": 1,
      "date": "2025-05-28",
      "time": "10:00 AM",
      "endTime": "12:00 PM",
      "type": "paid",
      "cost": "$150",
      "email": "user@example.com",
      "createdAt": "2025-05-28T12:34:56.789Z"
    },
    // ...more bookings
  ]
  ```

---

## POST /api/auth/google
Authenticate a user using Google Sign-In.

### Request
- **Content-Type:** application/json
- **Body Example:**
  ```json
  {
    "credential": "<Google ID token>"
  }
  ```
- **Required fields:**
  - `credential` (string, required)

### Response
- **Success (200):**
  ```json
  {
    "token": "<JWT token>",
    "user": {
      "email": "user@example.com",
      "name": "User Name",
      "picture": "https://...",
      "sub": "google-user-id"
    }
  }
  ```
- **Error (400/401):**
  ```json
  { "error": "Missing Google credential" }
  // or
  { "error": "Invalid Google credential" }
  ```

---

## POST /api/payment/flutterwave/initiate
Initiate a Flutterwave USD payment.

### Request
- **Content-Type:** application/json
- **Body Example:**
  ```json
  {
    "amount": "150",
    "email": "user@example.com",
    "name": "User Name",
    "tx_ref": "unique-transaction-ref-123",
    "redirect_url": "https://your-frontend.com/payment-complete"
  }
  ```
- **Required fields:**
  - `amount` (string or number, required)
  - `email` (string, required)
  - `name` (string, required)
  - `tx_ref` (string, required, must be unique per transaction)
  - `redirect_url` (string, required)

### Response
- **Success (200):**
  ```json
  {
    "status": "success",
    "message": "Payment link generated",
    "data": {
      "link": "https://checkout.flutterwave.com/v3/hosted/pay/xxxxxx"
    }
  }
  ```
- **Error (400/500):**
  ```json
  { "error": "Flutterwave payment initiation failed", "details": { ... } }
  ```

---

## POST /api/payment/flutterwave/verify
Verify a Flutterwave payment after redirect.

### Request
- **Content-Type:** application/json
- **Body Example:**
  ```json
  {
    "transaction_id": "1234567"
  }
  ```
- **Required fields:**
  - `transaction_id` (string or number, required)

### Response
- **Success (200):**
  ```json
  {
    "status": "success",
    "message": "Transaction fetched successfully",
    "data": { ... }
  }
  ```
- **Error (400/500):**
  ```json
  { "error": "Flutterwave verification failed", "details": { ... } }
  ```

---

## POST /api/payment/flutterwave/webhook
Flutterwave webhook endpoint for payment notifications.

### Request
- **Headers:**
  - `verif-hash`: Your `FLUTTERWAVE_SECRET_HASH` (used by Flutterwave to sign the webhook)
- **Body:** Raw JSON event from Flutterwave

### Response
- **Success (200):**
  ```json
  { "status": "success" }
  ```
- **Error (401):**
  ```json
  { "error": "Invalid signature" }
  ```
- **Error (400):**
  ```json
  { "error": "Invalid JSON" }
  ```

---

## PATCH /api/bookings/:id/mark-paid
Manually mark a booking as paid (for free or paid sessions).

### Request
- **URL Parameter:**
  - `id` (integer, required): The booking ID to mark as paid
- **No body required**

### Response
- **Success (200):**
  ```json
  { "message": "Booking marked as paid", "id": 123 }
  ```
- **Error (404):**
  ```json
  { "error": "Booking not found" }
  ```
- **Error (500):**
  ```json
  { "error": "Database error" }
  ```

---

## Notes
- CORS is enabled for local development.
- Bookings are stored in a SQLite database (`bookings.db`).
- Authentication uses Google Sign-In and JWT.
- User info is stored in a `users` table.
- Only first-time users (by email) can book a free consultation.
- The backend is modular and ready for payment and admin features.
- Extend as needed for email or additional integrations.
- Set your Flutterwave secret key in `.env` as `FLW_SECRET_KEY`.
- Use `/api/payment/flutterwave/initiate` to start a payment and get a checkout link.
- Use `/api/payment/flutterwave/verify` to confirm payment after redirect.
- All payment amounts are in USD.
- See https://developer.flutterwave.com/docs/getting-started for more details.
- The webhook endpoint verifies the `verif-hash` header using your `FLUTTERWAVE_SECRET_HASH` from `.env`.
- Use this endpoint to update payment/booking status based on event data from Flutterwave.
- See https://developer.flutterwave.com/docs/event-subscriptions for event details.
