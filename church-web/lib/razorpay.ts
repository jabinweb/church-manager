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
  
  console.log('Verifying payment signature:', {
    input: `${razorpayOrderId}|${razorpayPaymentId}`,
    generated: generatedSignature,
    received: razorpaySignature,
    match: generatedSignature === razorpaySignature
  })
  
  return generatedSignature === razorpaySignature
}

export const verifySubscription = (
  razorpaySubscriptionId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const crypto = require('crypto')
  const config = getRazorpayConfig()
  
  // Try multiple signature formats to find the correct one
  
  // Format 1: subscription_id|payment_id (most common for subscription authorization)
  const hmac1 = crypto.createHmac('sha256', config.keySecret)
  hmac1.update(`${razorpaySubscriptionId}|${razorpayPaymentId}`)
  const signature1 = hmac1.digest('hex')
  
  // Format 2: payment_id only
  const hmac2 = crypto.createHmac('sha256', config.keySecret)
  hmac2.update(razorpayPaymentId)
  const signature2 = hmac2.digest('hex')
  
  // Format 3: payment_id|subscription_id (reverse order)
  const hmac3 = crypto.createHmac('sha256', config.keySecret)
  hmac3.update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
  const signature3 = hmac3.digest('hex')
  
  console.log('Verifying subscription signature:', {
    subscriptionId: razorpaySubscriptionId,
    paymentId: razorpayPaymentId,
    format1: `${razorpaySubscriptionId}|${razorpayPaymentId}`,
    generated1: signature1,
    format2: `${razorpayPaymentId}`,
    generated2: signature2,
    format3: `${razorpayPaymentId}|${razorpaySubscriptionId}`,
    generated3: signature3,
    received: razorpaySignature,
    match1: signature1 === razorpaySignature,
    match2: signature2 === razorpaySignature,
    match3: signature3 === razorpaySignature
  })
  
  return signature1 === razorpaySignature || signature2 === razorpaySignature || signature3 === razorpaySignature
}
