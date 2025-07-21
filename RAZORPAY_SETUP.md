# Razorpay Environment Setup

## Test Environment (Development)

1. Set `RAZORPAY_ENV=test` in your `.env.local`
2. Use test keys from Razorpay Dashboard:
   - `RAZORPAY_TEST_KEY_ID=rzp_test_...`
   - `RAZORPAY_TEST_KEY_SECRET=...`

## Production Environment

1. Set `RAZORPAY_ENV=production` in your production environment
2. Use live keys from Razorpay Dashboard:
   - `RAZORPAY_LIVE_KEY_ID=rzp_live_...`
   - `RAZORPAY_LIVE_KEY_SECRET=...`

## Test Cards (for development)

- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **CVV:** Any 3 digits
- **Expiry:** Any future date

## Environment Variables Priority

1. Test environment: Uses `RAZORPAY_TEST_*` keys
2. Production environment: Uses `RAZORPAY_LIVE_*` keys
3. Environment controlled by `RAZORPAY_ENV` variable
