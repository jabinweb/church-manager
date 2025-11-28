'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShieldCheck, Send, Check, AlertCircle } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useSystemSettings } from '@/lib/hooks/useSystemSettings'
import { useSession } from 'next-auth/react'

// Define form schema
const prayerRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  request: z.string().min(5, 'Prayer request must be at least 5 characters')
    .max(1000, 'Prayer request cannot exceed 1000 characters'),
  isUrgent: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms',
  }),
})

export default function PrayerRequestPage() {
  const { data: session } = useSession()
  const { enablePrayerRequests } = useSystemSettings()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<z.infer<typeof prayerRequestSchema>>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: {
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      request: '',
      isUrgent: false,
      isAnonymous: false,
      agreeToTerms: false,
    },
  })
  
  const onSubmit = async (values: z.infer<typeof prayerRequestSchema>) => {
    if (!enablePrayerRequests) {
      toast.error('Prayer request submissions are currently disabled')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Submit prayer request to API
      const response = await fetch('/api/prayer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit prayer request')
      }
      
      setSubmitted(true)
      toast.success('Prayer request submitted successfully')
      form.reset()
    } catch (error) {
      console.error('Error submitting prayer request:', error)
      toast.error('There was a problem submitting your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Reset form and allow another submission
  const submitAnother = () => {
    setSubmitted(false)
    form.reset({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      request: '',
      isUrgent: false,
      isAnonymous: false,
      agreeToTerms: false,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 text-purple-600 mb-6 shadow-lg">
            <Heart className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Prayer Request
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            &quot;Cast all your anxiety on him because he cares for you.&quot; - 1 Peter 5:7
          </p>
        </motion.div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prayer Info Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mr-3">
                    <Heart className="h-5 w-5 text-purple-600" />
                  </div>
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Our prayer team is committed to praying for your needs. All prayer requests are treated with respect and confidentiality.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-xl mr-3 shadow-md">
                      <Send size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Submit Your Request</h3>
                      <p className="text-xs text-gray-500 mt-1">Fill out the form with your prayer needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl mr-3 shadow-md">
                      <Check size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Review Process</h3>
                      <p className="text-xs text-gray-500 mt-1">Our team reviews all requests within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-2.5 rounded-xl mr-3 shadow-md">
                      <Heart size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Prayer Support</h3>
                      <p className="text-xs text-gray-500 mt-1">Our prayer team commits to pray for your request</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mr-3">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Confidentiality</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Your requests are shared only with our prayer team members who have committed to confidentiality.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Respectful Response</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    We treat each request with the same level of care and respect, regardless of the nature of the need.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Anonymous Options</h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    You can choose to keep your name private while still receiving prayer support.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-red-900">Need Immediate Help?</CardTitle>
                <CardDescription className="text-red-700">
                  For crisis situations requiring immediate assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-white/80 rounded-lg">
                    <span className="font-semibold text-gray-900 text-sm">Church Office:</span>
                    <span className="ml-2 text-sm text-gray-700">(555) 123-4567</span>
                  </div>
                  <div className="flex items-center p-3 bg-white/80 rounded-lg">
                    <span className="font-semibold text-gray-900 text-sm">Pastor On Call:</span>
                    <span className="ml-2 text-sm text-gray-700">(555) 987-6543</span>
                  </div>
                  <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-semibold">
                      For emergencies, please call 911
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Prayer Request Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
                <CardTitle className="text-2xl text-gray-900">Submit a Prayer Request</CardTitle>
                <CardDescription className="text-gray-600">
                  Share your prayer needs with us, and our prayer team will faithfully pray for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {submitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 rounded-2xl h-20 w-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Check className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 text-gray-900">Thank You</h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto leading-relaxed">
                      Your prayer request has been submitted and will be shared with our prayer team.
                      We are honored to stand with you in prayer.
                    </p>
                    <Button 
                      onClick={submitAnother}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                    >
                      Submit Another Request
                    </Button>
                  </motion.div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {!enablePrayerRequests && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                          <div className="flex items-start">
                            <AlertCircle className="text-yellow-500 h-5 w-5 mr-2 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-medium text-yellow-800">
                                Prayer Request Submissions Paused
                              </h3>
                              <p className="text-sm text-yellow-700 mt-1">
                                Our prayer request system is currently unavailable. Please contact the church office directly.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                For follow-up communication
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="request"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prayer Request</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Please share what you'd like us to pray for..."
                                className="min-h-[150px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Please be as specific as you&apos;re comfortable with
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="isUrgent"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>This is an urgent request</FormLabel>
                                <FormDescription>
                                  Urgent requests are shared with our prayer team immediately
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="isAnonymous"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Keep my name anonymous</FormLabel>
                                <FormDescription>
                                  Your name won&apos;t be shared with the prayer team
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator />
                      
                      <FormField
                        control={form.control}
                        name="agreeToTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Terms and Conditions</FormLabel>
                              <FormDescription>
                                I understand this request will be shared with the church prayer team and
                                consent to them praying for my request.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg px-8"
                          size="lg"
                          disabled={isSubmitting || !enablePrayerRequests}
                        >
                          {isSubmitting ? (
                            <>
                              <Send className="mr-2 h-5 w-5 animate-pulse" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Submit Prayer Request
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Prayer Verses */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Scripture on Prayer
            </h2>
            <p className="text-gray-600 text-lg">Find encouragement in these verses about prayer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-md">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <p className="italic text-gray-700 mb-4 leading-relaxed">
                  &quot;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&quot;
                </p>
                <p className="font-semibold text-indigo-600">Philippians 4:6</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-md">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <p className="italic text-gray-700 mb-4 leading-relaxed">
                  &quot;And pray in the Spirit on all occasions with all kinds of prayers and requests. With this in mind, be alert and always keep on praying for all the Lord&apos;s people.&quot;
                </p>
                <p className="font-semibold text-purple-600">Ephesians 6:18</p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-gradient-to-br from-pink-50 to-rose-50 hover:shadow-2xl transition-shadow duration-300">
              <CardContent className="pt-8 pb-6 px-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-md">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <p className="italic text-gray-700 mb-4 leading-relaxed">
                  &quot;This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.&quot;
                </p>
                <p className="font-semibold text-pink-600">1 John 5:14</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
