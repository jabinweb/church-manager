import Razorpay from 'razorpay'

const isProduction = process.env.RAZORPAY_ENV === 'production'

export const getRazorpayConfig = () => {
  const keyId = isProduction 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID

  const keySecret = isProduction 
    ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    : process.env.RAZORPAY_TEST_KEY_SECRET

  if (!keyId || !keySecret) {
    console.error('Missing Razorpay credentials:', {
      isProduction,
      keyId: keyId ? 'present' : 'missing',
      keySecret: keySecret ? 'present' : 'missing',
    })
    throw new Error(`Missing Razorpay ${isProduction ? 'live' : 'test'} credentials`)
  }

  return {
    keyId,
    keySecret,
    isProduction
  }
}

export const createRazorpayInstance = () => {
  const config = getRazorpayConfig()
  
  return new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  })
}

export const getRazorpayKeyId = () => {
  const config = getRazorpayConfig()
  return config.keyId
}

export const createOrder = async (amount: number, orderId: string): Promise<any> => {
  try {
    
    const razorpayInstance = createRazorpayInstance()
    
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      payment_capture: true,
    })
    
    return order
  } catch (error: any) {
    console.error('Error creating Razorpay order:', {
      error,
      message: error.message,
      statusCode: error.statusCode,
      errorDetails: error.error
    })
    throw error
  }
}

export const verifyPayment = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const crypto = require('crypto')
  const config = getRazorpayConfig()
  const hmac = crypto.createHmac('sha256', config.keySecret)
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`)
  const generatedSignature = hmac.digest('hex')
  
  return generatedSignature === razorpaySignature
}
