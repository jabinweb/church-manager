'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSystemSettings } from '@/lib/useSystemSettings'
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  YoutubeIcon,
  MailIcon, 
  PhoneIcon, 
  MapPinIcon,
  HeartIcon,
  ChurchIcon
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Footer() {
  const { 
    churchName, 
    churchAddress, 
    churchEmail, 
    churchPhone, 
    facebookUrl, 
    twitterUrl, 
    instagramUrl,
    logoUrl 
  } = useSystemSettings()

  return (
    <footer className="bg-gradient-to-t from-gray-100 to-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Logo & Mission Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={churchName || 'Church Logo'}
                  width={48}
                  height={48}
                  className="mr-3 rounded"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <ChurchIcon size={24} className="text-purple-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{churchName || 'Grace Community Church'}</h3>
                <p className="text-sm text-purple-600">Growing together in faith</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              We&apos;re a community of believers dedicated to serving Christ and sharing His love with our neighbors and the world.
            </p>
            
            {/* Contact Information */}
            <div className="space-y-2">
              {churchAddress && (
                <div className="flex items-start">
                  <MapPinIcon size={20} className="text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{churchAddress}</span>
                </div>
              )}
              {churchPhone && (
                <div className="flex items-center">
                  <PhoneIcon size={20} className="text-purple-600 mr-2 flex-shrink-0" />
                  <a href={`tel:${churchPhone}`} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                    {churchPhone}
                  </a>
                </div>
              )}
              {churchEmail && (
                <div className="flex items-center">
                  <MailIcon size={20} className="text-purple-600 mr-2 flex-shrink-0" />
                  <a href={`mailto:${churchEmail}`} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                    {churchEmail}
                  </a>
                </div>
              )}
            </div>

            {/* Newsletter */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Sign up for our newsletter</h4>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Your email address"
                  className="h-9"
                />
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/events">Events</FooterLink>
              <FooterLink href="/sermons">Sermons</FooterLink>
              <FooterLink href="/giving">Give</FooterLink>
              <FooterLink href="/prayer">Prayer Requests</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
            </ul>
          </div>
          
          {/* Ministries */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Ministries</h4>
            <ul className="space-y-2">
              <FooterLink href="/ministries/adults">Adult Ministry</FooterLink>
              <FooterLink href="/ministries/youth">Youth Ministry</FooterLink>
              <FooterLink href="/ministries/children">Children&apos;s Ministry</FooterLink>
              <FooterLink href="/ministries/worship">Worship Ministry</FooterLink>
              <FooterLink href="/ministries/outreach">Outreach</FooterLink>
              <FooterLink href="/ministries">All Ministries</FooterLink>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/news">News</FooterLink>
              <FooterLink href="/bookstore">Bookstore</FooterLink>
              <FooterLink href="/calendar">Calendar</FooterLink>
              <FooterLink href="/live">Live Stream</FooterLink>
              <FooterLink href="/members">Member Portal</FooterLink>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Social & Copyright */}
      <div className="border-t border-gray-200 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            {facebookUrl && (
              <SocialLink href={facebookUrl} icon={<FacebookIcon size={20} />} label="Facebook" />
            )}
            {twitterUrl && (
              <SocialLink href={twitterUrl} icon={<TwitterIcon size={20} />} label="Twitter" />
            )}
            {instagramUrl && (
              <SocialLink href={instagramUrl} icon={<InstagramIcon size={20} />} label="Instagram" />
            )}
            <SocialLink href="#" icon={<YoutubeIcon size={20} />} label="YouTube" />
          </div>
          
          <div className="text-gray-500 text-sm">
            <div className="flex space-x-4 mb-2 justify-center md:justify-end">
              <Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-purple-600 transition-colors">Terms of Use</Link>
              <Link href="/sitemap" className="hover:text-purple-600 transition-colors">Sitemap</Link>
            </div>
            <p className="text-center md:text-right">
              &copy; {new Date().getFullYear()} {churchName || 'Grace Community Church'} • Made with <HeartIcon size={12} className="inline text-red-500" /> in Christ
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Helper Components
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
        {children}
      </Link>
    </li>
  )
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 bg-gray-100 hover:bg-purple-100 rounded-full flex items-center justify-center transition-colors group"
    >
      <span className="text-gray-500 group-hover:text-purple-600 transition-colors">
        {icon}
      </span>
    </a>
  )
}