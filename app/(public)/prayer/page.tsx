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
    <div className="min-h-screen bg-gradient-to-br from-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Prayer Request</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            &quot;Cast all your anxiety on him because he cares for you.&quot; - 1 Peter 5:7
          </p>
        </motion.div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Prayer Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-purple-600" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our prayer team is committed to praying for your needs. All prayer requests are treated with respect and confidentiality.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Send size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Submit Your Request</h3>
                      <p className="text-xs text-gray-500">Fill out the form with your prayer needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Check size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Review Process</h3>
                      <p className="text-xs text-gray-500">Our team reviews all requests within 24 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Heart size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Prayer Support</h3>
                      <p className="text-xs text-gray-500">Our prayer team commits to pray for your request</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="mr-2 h-5 w-5 text-purple-600" />
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Confidentiality</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Your requests are shared only with our prayer team members who have committed to confidentiality.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Respectful Response</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    We treat each request with the same level of care and respect, regardless of the nature of the need.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Anonymous Options</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    You can choose to keep your name private while still receiving prayer support.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Need Immediate Help?</CardTitle>
                <CardDescription>
                  For crisis situations requiring immediate assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Church Office:</span> (555) 123-4567
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Pastor On Call:</span> (555) 987-6543
                  </p>
                  <p className="text-sm text-red-600 font-medium mt-4">
                    For emergencies, please call 911
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Prayer Request Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Submit a Prayer Request</CardTitle>
                <CardDescription>
                  Share your prayer needs with us, and our prayer team will faithfully pray for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="bg-green-100 text-green-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Thank You</h3>
                    <p className="text-gray-600 mb-6">
                      Your prayer request has been submitted and will be shared with our prayer team.
                      We are honored to stand with you in prayer.
                    </p>
                    <Button onClick={submitAnother}>Submit Another Request</Button>
                  </div>
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
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={isSubmitting || !enablePrayerRequests}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Prayer Request'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Prayer Verses */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold">Scripture on Prayer</h2>
            <p className="text-gray-600">Find encouragement in these verses about prayer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <p className="italic text-gray-600 mb-4">
                  &quot;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&quot;
                </p>
                <p className="font-medium">Philippians 4:6</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="italic text-gray-600 mb-4">
                  &quot;And pray in the Spirit on all occasions with all kinds of prayers and requests. With this in mind, be alert and always keep on praying for all the Lord&apos;s people.&quot;
                </p>
                <p className="font-medium">Ephesians 6:18</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <p className="italic text-gray-600 mb-4">
                  &quot;This is the confidence we have in approaching God: that if we ask anything according to his will, he hears us.&quot;
                </p>
                <p className="font-medium">1 John 5:14</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
