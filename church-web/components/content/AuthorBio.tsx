'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AuthorProps {
  title?: string
  name: string | null | undefined
  image: string | null | undefined
  role?: string
  bio?: string
  getInitials?: (name: string) => string
}

export default function AuthorBio({
  title, 
  name, 
  image, 
  role = 'Author', 
  bio = 'Passionate about bringing the community together through faith and service.', 
  getInitials = (name) => {
    if (!name) return 'GC';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}: AuthorProps) {
  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <Avatar className="h-20 w-20">
          {image ? (
            <AvatarImage src={image} />
          ) : (
            <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
              {getInitials(name || 'Anonymous')}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <h4 className="text-xl font-semibold mb-1">{name || 'Anonymous'}</h4>
          <p className="text-sm text-purple-600 mb-3">{role}</p>
          <p className="text-gray-600">{bio}</p>
        </div>
      </div>
    </div>
  )
}
