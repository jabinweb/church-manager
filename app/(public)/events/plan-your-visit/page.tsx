'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { format } from 'date-fns'
import { ArrowRight, Calendar, Users, Info, Check, MapPin, CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Form schema for validation
const visitFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(6, 'Phone number is required'),
  visitDate: z.date({
    required_error: 'Please select a date',
  }),
  serviceTime: z.string({
    required_error: 'Please select a service time',
  }),
  numberOfGuests: z.string().min(1, 'Please indicate number of guests'),
  includeChildren: z.boolean().default(false),
  numberOfChildren: z.string().optional(),
  childrenAges: z.string().optional(),
  specialRequests: z.string().optional(),
  howHeard: z.string().optional(),
  contactConsent: z.boolean().default(true),
})

type VisitFormValues = z.infer<typeof visitFormSchema>

export default function PlanYourVisitPage() {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Service times - these could come from an API/DB
  const serviceTimes = [
    { id: 'sunday-9am', label: 'Sunday 9:00 AM', description: 'Contemporary Service' },
    { id: 'sunday-11am', label: 'Sunday 11:00 AM', description: 'Traditional Service' },
    { id: 'wednesday-7pm', label: 'Wednesday 7:00 PM', description: 'Midweek Bible Study' },
  ]

  // Form initialization
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      fullName: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: '',
      visitDate: undefined,
      serviceTime: '',
      numberOfGuests: '1', 
      includeChildren: false,
      numberOfChildren: '',
      childrenAges: '',
      specialRequests: '',
      howHeard: '',
      contactConsent: true,
    },
  })
  
  const watchIncludeChildren = form.watch('includeChildren')
  const watchNumberOfGuests = form.watch('numberOfGuests')

  // Get next Sunday for the calendar
  const getNextSunday = () => {
    const today = new Date()
    const day = today.getDay() // 0 is Sunday
    const daysUntilNextSunday = day === 0 ? 7 : 7 - day
    const nextSunday = new Date(today)
    nextSunday.setDate(today.getDate() + daysUntilNextSunday)
    return nextSunday
  }
  
  // Form submission
  const onSubmit = async (values: VisitFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Here you would typically send the form data to your API
      // const response = await fetch('/api/events/visit-registration', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(values),
      // })
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitted(true)
      toast.success('Your visit has been registered successfully!')
    } catch (error) {
      console.error('Error registering visit:', error)
      toast.error('There was a problem registering your visit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 mb-4">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Plan Your Visit</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're excited to welcome you! Let us know when you're coming so we can prepare a warm welcome.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Form Column */}
          <div className="lg:col-span-2">
            {submitted ? (
              <Card className="shadow-lg border-0">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="bg-green-100 text-green-700 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <Check className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">You're All Set!</h3>
                    <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                      We've received your information and are looking forward to meeting you on{' '}
                      <span className="font-semibold">
                        {form.getValues('visitDate') && format(form.getValues('visitDate'), 'EEEE, MMMM d, yyyy')}
                      </span>{' '}
                      at the{' '}
                      <span className="font-semibold">
                        {serviceTimes.find(st => st.id === form.getValues('serviceTime'))?.label || form.getValues('serviceTime')}
                      </span>{' '}
                      service.
                    </p>
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left">
                        <h4 className="font-medium text-blue-900 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          What to Expect
                        </h4>
                        <ul className="mt-2 space-y-1 text-blue-800 text-sm">
                          <li>• Arrive 10-15 minutes early to check in at our Welcome Center</li>
                          <li>• A greeter will help you find your way around</li>
                          <li>• We have a special gift waiting for you</li>
                          <li>• Coffee and refreshments are available before the service</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-gray-500 text-sm">
                          We've sent a confirmation email to {form.getValues('email')} with all the details.
                        </p>
                        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                          <Link href="/visit">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Learn More About Our Church
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Register Your Visit</CardTitle>
                  <CardDescription>
                    Tell us a little about yourself and when you'd like to join us
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Personal Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Your Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="your@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="(123) 456-7890" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Visit Details Section */}
                      <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-medium">Visit Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="visitDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>When Will You Visit?</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Select a date</span>
                                        )}
                                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => {
                                        // Can't select dates in the past
                                        return date < new Date(new Date().setHours(0, 0, 0, 0))
                                      }}
                                      defaultMonth={getNextSunday()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Select your planned visit date
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="serviceTime"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel>Service Time</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-2"
                                  >
                                    {serviceTimes.map((service) => (
                                      <div key={service.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={service.id} id={service.id} />
                                        <label htmlFor={service.id} className="flex flex-col cursor-pointer">
                                          <span className="font-medium">{service.label}</span>
                                          <span className="text-gray-500 text-sm">{service.description}</span>
                                        </label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="numberOfGuests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Adults (including yourself)</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-wrap gap-4"
                                >
                                  {["1", "2", "3", "4", "5+"].map((num) => (
                                    <div key={num} className="flex items-center space-x-2">
                                      <RadioGroupItem value={num} id={`guests-${num}`} />
                                      <label htmlFor={`guests-${num}`} className="cursor-pointer">
                                        {num}
                                      </label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="includeChildren"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>I'm bringing children</FormLabel>
                                <FormDescription>
                                  We have children's programs during our services
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {watchIncludeChildren && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8 border-l-2 border-purple-100">
                            <FormField
                              control={form.control}
                              name="numberOfChildren"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Children</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-wrap gap-4"
                                    >
                                      {["1", "2", "3", "4", "5+"].map((num) => (
                                        <div key={num} className="flex items-center space-x-2">
                                          <RadioGroupItem value={num} id={`children-${num}`} />
                                          <label htmlFor={`children-${num}`} className="cursor-pointer">
                                            {num}
                                          </label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="childrenAges"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age Range</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., 3, 5, 7" 
                                      {...field} 
                                      value={field.value || ''}
                                    />
                                  </FormControl>
                                  <FormDescription>Enter children's ages</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Requests or Questions (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Let us know if you have any questions or special needs"
                                  className="min-h-[100px]"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="howHeard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How did you hear about us? (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Friend, Website, Social Media" 
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="contactConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Communication Consent</FormLabel>
                              <FormDescription>
                                I agree to receive communications regarding my visit and church activities
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Submitting...' : 'Reserve My Spot'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-purple-600" />
                  Our Location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded-md overflow-hidden mb-4 aspect-video bg-gray-100">
                  <Image
                    src="/images/church-map.jpg"
                    alt="Church Location"
                    className="w-full h-auto object-cover"
                    width={400}
                    height={300}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "https://placehold.co/400x300?text=Church+Map"
                    }}
                  />
                </div>
                <p className="text-base font-medium">Grace Community Church</p>
                <p className="text-gray-500">123 Faith Street</p>
                <p className="text-gray-500">Springfield, IL 62701</p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">
                    Get Directions
                  </a>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  What to Expect
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 h-5">60-75min</Badge>
                    <span className="text-gray-600 text-sm">Service Length</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 h-5">Casual</Badge>
                    <span className="text-gray-600 text-sm">Dress Code</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 h-5">Contemporary</Badge>
                    <span className="text-gray-600 text-sm">Worship Style</span>
                  </li>
                  <li className="flex gap-2">
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 h-5">Free Parking</Badge>
                    <span className="text-gray-600 text-sm">Plenty of spaces available</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-purple-600" />
                  For Families
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  We offer engaging programs for children of all ages during our services:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Nursery care for ages 0-2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Preschool program for ages 3-5</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Elementary program for grades K-5</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Youth group for grades 6-12</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <CardContent className="pt-6">
                <h3 className="font-medium text-lg mb-2">Need Help?</h3>
                <p className="text-white/90 mb-4">
                  If you have questions or need assistance, feel free to contact us:
                </p>
                <p className="text-white/90 mb-1">📱 (555) 123-4567</p>
                <p className="text-white/90">✉️ welcome@gracechurch.org</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
