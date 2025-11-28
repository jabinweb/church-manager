'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ImageIcon, Upload, X, Folder, Link, Check } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import MediaSelector from './MediaSelector'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
}

export default function ImageUpload({
  value,
  onChange,
  onRemove
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [tempUrl, setTempUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'blog-image')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        onChange(data.url)
        toast.success('Image uploaded successfully')
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleMediaSelect = (file: any) => {
    if (file.url) {
      onChange(file.url)
      toast.success('Image selected successfully')
    } else {
      onRemove()
    }
  }

  const validateImageUrl = (url: string): boolean => {
    // Basic URL validation
    try {
      new URL(url)
      // Check if URL looks like an image (basic check)
      const imageExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg'
      ]
      const lowerUrl = url.toLowerCase()
      const hasImageExtension = imageExtensions.some(ext =>
        lowerUrl.includes(ext)
      )
      const hasImageParam = lowerUrl.includes('image') || lowerUrl.includes('img')
      const isValidImageUrl =
        hasImageExtension ||
        hasImageParam ||
        lowerUrl.includes('blob:') ||
        lowerUrl.includes('data:image')

      return isValidImageUrl
    } catch {
      return false
    }
  }

  const handleUrlSubmit = () => {
    if (!tempUrl.trim()) {
      setUrlError('Please enter a URL')
      return
    }

    if (!validateImageUrl(tempUrl)) {
      setUrlError('Please enter a valid image URL')
      return
    }

    onChange(tempUrl.trim())
    setTempUrl('')
    setUrlError('')
    setUrlDialogOpen(false)
    toast.success('Image URL set successfully')
  }

  const openUrlDialog = () => {
    setTempUrl(value || '')
    setUrlError('')
    setUrlDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative aspect-video w-full max-w-sm mx-auto group">
          <Image
            src={value}
            alt="Featured image"
            fill
            className="object-contain rounded-lg"
            onError={() => {
              toast.error('Failed to load image')
            }}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              onClick={onRemove}
              variant="destructive"
              size="sm"
              className="h-8 w-8 p-0"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No image selected</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          className="hidden"
          id="image-upload"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => document.getElementById('image-upload')?.click()}
          disabled={uploading}
          title={uploading ? 'Uploading...' : 'Upload new image'}
        >
          <Upload className="h-4 w-4" />
        </Button>

        <MediaSelector
          onSelect={handleMediaSelect}
          selectedUrl={value}
          allowedTypes={['image/*']}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            title="Browse files"
          >
            <Folder className="h-4 w-4" />
          </Button>
        </MediaSelector>

        <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={openUrlDialog}
              title="Set image URL"
            >
              <Link className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Image URL</DialogTitle>
              <DialogDescription>
                Enter a direct URL to an image
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={tempUrl}
                  onChange={e => {
                    setTempUrl(e.target.value)
                    setUrlError('')
                  }}
                  placeholder="https://example.com/image.jpg"
                  className={urlError ? 'border-red-500' : ''}
                />
                {urlError && (
                  <p className="text-sm text-red-500 mt-1">{urlError}</p>
                )}
              </div>

              {tempUrl && validateImageUrl(tempUrl) && (
                <div className="border rounded-lg p-2">
                  <Label className="text-sm text-gray-600 mb-2 block">
                    Preview:
                  </Label>
                  <div className="relative aspect-video w-full max-w-xs">
                    <Image
                      src={tempUrl}
                      alt="URL preview"
                      fill
                      className="object-contain rounded"
                      onError={() =>
                        setUrlError('Failed to load image from this URL')
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUrlDialogOpen(false)
                    setTempUrl('')
                    setUrlError('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!tempUrl.trim() || !!urlError}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Set URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onRemove}
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

