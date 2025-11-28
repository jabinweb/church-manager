'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Upload, ImageIcon, RefreshCcw, Check, X, Info } from 'lucide-react'
import Image from 'next/image'

interface ImageOptimizerProps {
  onImageOptimized: (imageUrl: string) => void
  maxSizeInMB?: number
  maxWidthPx?: number
  defaultQuality?: number
}

export default function ImageOptimizer({
  onImageOptimized,
  maxSizeInMB = 1,
  maxWidthPx = 1920,
  defaultQuality = 85
}: ImageOptimizerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [originalSize, setOriginalSize] = useState<number>(0)
  const [optimizedSize, setOptimizedSize] = useState<number>(0)
  const [quality, setQuality] = useState<number>(defaultQuality)
  const [optimizationComplete, setOptimizationComplete] = useState(false)
  const [resizeImage, setResizeImage] = useState(true)
  
  // Format file size display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    setSelectedFile(file)
    setOriginalSize(file.size)
    setOptimizedSize(0)
    setOptimizationComplete(false)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // Optimize image
  const optimizeImage = useCallback(async () => {
    if (!selectedFile) return
    
    setIsOptimizing(true)
    
    try {
      // Create a canvas element to resize and compress the image
      const img = new globalThis.Image() // Use the DOM's Image constructor, not Next.js Image component
      
      // Create a promise that resolves when the image is loaded
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
      })
      
      // Set the image source and wait for it to load
      img.src = previewUrl as string
      await imageLoadPromise
      
      // Calculate new dimensions if resizing is enabled
      let newWidth = img.width
      let newHeight = img.height
      
      if (resizeImage && img.width > maxWidthPx) {
        const ratio = maxWidthPx / img.width
        newWidth = maxWidthPx
        newHeight = Math.round(img.height * ratio)
      }
      
      // Create canvas for resizing/compressing
      const canvas = document.createElement('canvas')
      canvas.width = newWidth
      canvas.height = newHeight
      
      // Draw image on canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      // Use better quality image rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw the image
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      // Convert to blob with specified quality
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => resolve(b as Blob),
          selectedFile.type, 
          quality / 100
        )
      })
      
      // Create FormData for the upload
      const formData = new FormData()
      formData.append('image', blob, selectedFile.name)
      
      // Upload the optimized image
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload image')
      }
      
      const data = await response.json()
      setOptimizedSize(blob.size)
      setOptimizationComplete(true)
      onImageOptimized(data.url)
      
      toast.success('Image optimized and uploaded successfully')
    } catch (error) {
      console.error('Error optimizing image:', error)
      toast.error('Failed to optimize and upload image')
    } finally {
      setIsOptimizing(false)
    }
  }, [selectedFile, previewUrl, quality, resizeImage, maxWidthPx, onImageOptimized])
  
  // Reset everything
  const resetSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setOptimizedSize(0)
    setOptimizationComplete(false)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="space-y-2">
        <Label htmlFor="image-upload">Select Image</Label>
        <Input 
          id="image-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          disabled={isOptimizing}
        />
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Info size={12} />
          <span>Max size: {maxSizeInMB}MB, Recommended width: {maxWidthPx}px</span>
        </div>
      </div>
      
      {previewUrl && (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-md overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-80 max-w-full mx-auto object-contain"
            />
          </div>
          
          {/* Optimization options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Quality: {quality}%</Label>
                {originalSize > 0 && (
                  <span className="text-sm text-gray-500">
                    Original: {formatFileSize(originalSize)}
                  </span>
                )}
              </div>
              <Slider
                value={[quality]}
                onValueChange={(val) => setQuality(val[0])}
                min={30}
                max={95}
                step={1}
                disabled={isOptimizing}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={resizeImage}
                onCheckedChange={setResizeImage}
                disabled={isOptimizing}
              />
              <Label>Auto-resize large images to {maxWidthPx}px width</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="bg-purple-600 hover:bg-purple-700 flex-1"
                onClick={optimizeImage}
                disabled={!selectedFile || isOptimizing || optimizationComplete}
              >
                {isOptimizing ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Optimizing...
                  </>
                ) : optimizationComplete ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Optimized
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Optimize & Upload
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetSelection}
                disabled={isOptimizing}
              >
                <X className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
            
            {optimizedSize > 0 && (
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Optimized size:</span>
                  <span className="font-medium text-purple-600">
                    {formatFileSize(optimizedSize)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Compression ratio:</span>
                  <span className="font-medium text-green-600">
                    {Math.round((1 - (optimizedSize / originalSize)) * 100)}% reduced
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!previewUrl && (
        <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Select an image to optimize
          </p>
        </div>
      )}
    </div>
  )
}
