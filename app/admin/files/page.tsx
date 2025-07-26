'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Upload, 
  File, 
  ImageIcon, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  Search, 
  Grid,
  List,
  FolderPlus,
  Copy,
  Move,
  Share2,
  MoreVertical,
  User,
  HardDrive,
  Loader2,
  ArrowLeft,
  Folder,
  Archive,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import Image from 'next/image'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  mimeType?: string
  url?: string
  path: string
  parentId?: string
  createdAt: string
  updatedAt: string
  uploadedBy: {
    id: string
    name: string
  }
  isPublic: boolean
  tags: string[]
  description?: string
}

interface FileStats {
  totalFiles: number
  totalSize: number
  totalFolders: number
  recentUploads: number
  publicFiles: number
  privateFiles: number
  blobCount?: number
  blobSize?: number
  syncStatus?: {
    lastSync: string
    dbFiles: number
    blobFiles: number
    inSync: boolean
    sizeDifference: number
    error?: boolean // Add error property
    fallback?: boolean // Add fallback property for when using DB stats
  }
}

export default function FileManagementPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [stats, setStats] = useState<FileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  const fetchFiles = useCallback(async (forceSync = false) => {
    try {
      console.log('Fetching files for path:', currentPath)
      const syncParam = forceSync ? '&sync=true' : ''
      const response = await fetch(`/api/admin/files?path=${encodeURIComponent(currentPath)}${syncParam}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched files:', data.files.length, data.files)
        setFiles(data.files || [])
        if (forceSync) {
          setLastSync(new Date().toISOString())
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [currentPath])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/files/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchFiles()
    fetchStats()
  }, [fetchFiles, fetchStats])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    const formData = new FormData()
    
    acceptedFiles.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('path', currentPath)

    try {
      const response = await fetch('/api/admin/files/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Uploaded ${data.uploadedCount} file(s) successfully`)
        fetchFiles()
        fetchStats()
        setUploadDialogOpen(false)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }, [currentPath, fetchFiles, fetchStats])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    console.log('Creating folder:', { name: newFolderName, path: currentPath })

    try {
      const response = await fetch('/api/admin/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          path: currentPath // Send the current path where folder should be created
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Folder created:', result)
        toast.success('Folder created successfully')
        setNewFolderName('')
        setCreateFolderOpen(false)
        fetchFiles() // Refresh the file list
      } else {
        const error = await response.json()
        console.error('Folder creation error:', error)
        toast.error(error.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const deleteFile = async (fileId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling to avoid triggering other actions
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('File deleted successfully')
        fetchFiles()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  const renameFile = async () => {
    if (!selectedFile || !newFileName.trim()) return

    try {
      const response = await fetch(`/api/admin/files/${selectedFile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFileName.trim()
        })
      })

      if (response.ok) {
        toast.success('File renamed successfully')
        setRenameDialogOpen(false)
        setSelectedFile(null)
        setNewFileName('')
        fetchFiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to rename file')
      }
    } catch (error) {
      console.error('Error renaming file:', error)
      toast.error('Failed to rename file')
    }
  }

  const downloadFile = (file: FileItem) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started')
    } else {
      toast.error('File URL not available')
    }
  }

  const copyFile = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/admin/files/${file.id}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath })
      })

      if (response.ok) {
        toast.success('File copied successfully')
        fetchFiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to copy file')
      }
    } catch (error) {
      console.error('Error copying file:', error)
      toast.error('Failed to copy file')
    }
  }

  const shareFile = (file: FileItem) => {
    setSelectedFile(file)
    setShareDialogOpen(true)
  }

  const copyShareLink = () => {
    if (selectedFile?.url) {
      const fullUrl = `${window.location.origin}${selectedFile.url}`
      navigator.clipboard.writeText(fullUrl).then(() => {
        toast.success('Share link copied to clipboard')
      }).catch(() => {
        toast.error('Failed to copy link')
      })
    }
  }

  const toggleFileVisibility = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/admin/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: !file.isPublic
        })
      })

      if (response.ok) {
        toast.success(`File is now ${!file.isPublic ? 'public' : 'private'}`)
        fetchFiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update file visibility')
      }
    } catch (error) {
      console.error('Error updating file visibility:', error)
      toast.error('Failed to update file visibility')
    }
  }

  const previewFile = (file: FileItem) => {
    setSelectedFile(file)
    setPreviewDialogOpen(true)
  }

  const openRenameDialog = (file: FileItem) => {
    setSelectedFile(file)
    setNewFileName(file.name)
    setRenameDialogOpen(true)
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)? This action cannot be undone.`)) {
      return
    }

    try {
      const promises = selectedFiles.map(fileId => 
        fetch(`/api/admin/files/${fileId}`, { method: 'DELETE' })
      )
      
      await Promise.all(promises)
      toast.success(`${selectedFiles.length} file(s) deleted successfully`)
      setSelectedFiles([])
      fetchFiles()
      fetchStats()
    } catch (error) {
      console.error('Error deleting files:', error)
      toast.error('Failed to delete some files')
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="h-6 w-6 text-blue-500" />
    
    if (!file.mimeType) return <File className="h-6 w-6 text-gray-500" />
    
    if (file.mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-green-500" />
    if (file.mimeType.startsWith('video/')) return <Video className="h-6 w-6 text-red-500" />
    if (file.mimeType.startsWith('audio/')) return <Music className="h-6 w-6 text-purple-500" />
    if (file.mimeType.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />
    if (file.mimeType.includes('document') || file.mimeType.includes('word')) return <FileText className="h-6 w-6 text-blue-600" />
    if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel')) return <FileText className="h-6 w-6 text-green-600" />
    if (file.mimeType.includes('archive') || file.mimeType.includes('zip')) return <Archive className="h-6 w-6 text-orange-500" />
    
    return <File className="h-6 w-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || 
      (selectedType === 'images' && file.mimeType?.startsWith('image/')) ||
      (selectedType === 'videos' && file.mimeType?.startsWith('video/')) ||
      (selectedType === 'audio' && file.mimeType?.startsWith('audio/')) ||
      (selectedType === 'documents' && file.mimeType?.includes('document')) ||
      (selectedType === 'folders' && file.type === 'folder')
    
    return matchesSearch && matchesType
  })

  const navigateToFolder = (folderId: string, folderName: string) => {
    // Build the new path by appending the folder name to current path
    const newPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`
    setCurrentPath(newPath)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(p => p)
    if (pathParts.length > 0) {
      pathParts.pop()
      setCurrentPath(pathParts.length === 0 ? '/' : '/' + pathParts.join('/'))
    }
  }

  const performSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/files/sync', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const { added, updated, removed, skipped, timeout, message } = data.syncResult
        
        if (timeout) {
          toast.warning(message || 'Sync timeout - showing database files only')
        } else {
          let successMessage = `Sync completed: ${added} added, ${updated} updated, ${removed} removed`
          if (skipped > 0) {
            successMessage += `, ${skipped} skipped`
          }
          toast.success(successMessage)
        }
        
        setLastSync(new Date().toISOString())
        fetchFiles(true) // Force sync after manual sync
        fetchStats()
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Failed to sync with cloud storage - showing database files only')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent">
                File Management
              </h1>
              <p className="text-gray-600 mt-2 text-sm lg:text-base">Manage your organization&apos;s files and media assets</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button 
                variant="outline" 
                onClick={performSync} 
                disabled={syncing}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 text-sm"
                size="sm"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
              
              {lastSync && (
                <span className="text-xs text-gray-500 hidden sm:inline">
                  Last sync: {format(new Date(lastSync), 'HH:mm:ss')}
                </span>
              )}

              <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">New Folder</span>
                    <span className="sm:hidden">Folder</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                      Create a new folder in {currentPath}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Upload Files</span>
                    <span className="sm:hidden">Upload</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Files</DialogTitle>
                    <DialogDescription>
                      Upload files to {currentPath}
                    </DialogDescription>
                  </DialogHeader>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                        <p className="text-blue-600 font-medium">Uploading files...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Drop files here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Support for all file types up to 50MB per file
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Files</p>
                    <p className="text-xl lg:text-3xl font-bold">{stats.totalFiles}</p>
                    {stats.blobCount !== undefined && (
                      <p className="text-blue-200 text-xs hidden lg:block">
                        Blob: {typeof stats.blobCount === 'number' ? stats.blobCount : 'Unavailable'}
                      </p>
                    )}
                  </div>
                  <File className="h-6 w-6 lg:h-8 lg:w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-400 to-emerald-500 text-white">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs lg:text-sm font-medium">Storage Used</p>
                    <p className="text-xl lg:text-3xl font-bold">{formatFileSize(stats.totalSize)}</p>
                    {stats.blobSize !== undefined && (
                      <p className="text-green-200 text-xs">
                        Blob: {formatFileSize(stats.blobSize)} {stats.syncStatus?.error && '(Unavailable)'}
                      </p>
                    )}
                  </div>
                  <HardDrive className="h-6 w-6 lg:h-8 lg:w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-400 to-pink-500 text-white">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs lg:text-sm font-medium">Folders</p>
                    <p className="text-xl lg:text-3xl font-bold">{stats.totalFolders}</p>
                    {stats.syncStatus && (
                      <p className={`text-xs ${stats.syncStatus.error ? 'text-red-200' : stats.syncStatus.inSync ? 'text-purple-200' : 'text-yellow-200'}`}>
                        {stats.syncStatus.error ? 'Sync Error' : stats.syncStatus.inSync ? 'In Sync' : 'Sync Needed'}
                      </p>
                    )}
                  </div>
                  <Folder className="h-6 w-6 lg:h-8 lg:w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs lg:text-sm font-medium">Recent Uploads</p>
                    <p className="text-xl lg:text-3xl font-bold">{stats.recentUploads}</p>
                  </div>
                  <Upload className="h-6 w-6 lg:h-8 lg:w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 lg:p-6">
              {/* Breadcrumb - Mobile responsive */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-2 lg:space-y-0">
                <div className="flex items-center space-x-1 lg:space-x-2 text-sm overflow-x-auto">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentPath('/')} className="text-xs lg:text-sm">
                    Home
                  </Button>
                  {currentPath.split('/').filter(p => p).map((part, index, array) => (
                    <div key={index} className="flex items-center">
                      <span className="text-gray-400 mx-2">/</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newPath = '/' + array.slice(0, index + 1).join('/')
                          setCurrentPath(newPath)
                        }}
                        className={index === array.length - 1 ? 'text-blue-600 font-medium' : ''}
                      >
                        {part}
                      </Button>
                    </div>
                  ))}
                  {currentPath !== '/' && (
                    <Button variant="outline" size="sm" onClick={navigateUp} className="ml-4">
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filters - Mobile responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="File Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="folders">Folders</SelectItem>
                    <SelectItem value="images">Images</SelectItem>
                    <SelectItem value="videos">Videos</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredFiles.length} items
                  </span>
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-600">
                        {selectedFiles.length} selected
                      </span>
                      <Button size="sm" variant="outline" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* File Grid/List - Update for mobile responsiveness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Upload some files to get started'}
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-6">
              {filteredFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-4">
                      <div className="relative">
                        {/* File Preview */}
                        <div 
                          className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden"
                          onClick={() => file.type === 'folder' ? navigateToFolder(file.id, file.name) : previewFile(file)}
                        >
                          {file.mimeType?.startsWith('image/') && file.url ? (
                            <Image
                              src={file.url}
                              alt={file.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            getFileIcon(file)
                          )}
                          
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex space-x-2">
                              {file.type === 'file' && (
                                <>
                                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); previewFile(file) }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); downloadFile(file) }}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="secondary" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(file) }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  {file.type === 'file' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyFile(file) }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); shareFile(file) }}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleFileVisibility(file) }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Make {file.isPublic ? 'Private' : 'Public'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id, e) }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {/* File Info */}
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                            {file.name}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{file.size ? formatFileSize(file.size) : '--'}</span>
                            <Badge variant={file.isPublic ? 'default' : 'secondary'}>
                              {file.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(file.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles(filteredFiles.map(f => f.id))
                              } else {
                                setSelectedFiles([])
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Type</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Size</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Modified</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Uploaded By</th>
                        <th className="text-left py-3 px-6 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFiles([...selectedFiles, file.id])
                                } else {
                                  setSelectedFiles(selectedFiles.filter(id => id !== file.id))
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div 
                              className="flex items-center space-x-3 cursor-pointer"
                              onClick={() => file.type === 'folder' ? navigateToFolder(file.id, file.name) : previewFile(file)}
                            >
                              {getFileIcon(file)}
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                {file.tags.length > 0 && (
                                  <div className="flex space-x-1 mt-1">
                                    {file.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {file.type === 'folder' ? 'Folder' : file.mimeType || 'Unknown'}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {file.size ? formatFileSize(file.size) : '--'}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {format(new Date(file.updatedAt), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{file.uploadedBy.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              {file.type === 'file' && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => previewFile(file)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => downloadFile(file)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRenameDialog(file) }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  {file.type === 'file' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyFile(file) }}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); shareFile(file) }}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleFileVisibility(file) }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Make {file.isPublic ? 'Private' : 'Public'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); deleteFile(file.id, e) }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename File</DialogTitle>
              <DialogDescription>
                Enter a new name for &quot;{selectedFile?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newName">New Name</Label>
                <Input
                  id="newName"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new name"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={renameFile} disabled={!newFileName.trim()}>
                  Rename
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share File</DialogTitle>
              <DialogDescription>
                Share &quot;{selectedFile?.name}&quot; with others
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>File Link</Label>
                <div className="flex space-x-2">
                  <Input
                    readOnly
                    value={selectedFile?.url ? `${window.location.origin}${selectedFile.url}` : ''}
                    className="bg-gray-50"
                  />
                  <Button onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFile?.isPublic || false}
                  onChange={() => selectedFile && toggleFileVisibility(selectedFile)}
                  id="publicAccess"
                  className="rounded border-gray-300"
                />
                <Label htmlFor="publicAccess">Allow public access</Label>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto">
              {selectedFile && selectedFile.mimeType?.startsWith('image/') && selectedFile.url && (
                <Image
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  width={800}
                  height={200}
                  className="max-w-full h-full object-contain"
                />
              )}
              {selectedFile && selectedFile.mimeType?.startsWith('video/') && selectedFile.url && (
                <video controls className="max-w-full h-auto">
                  <source src={selectedFile.url} type={selectedFile.mimeType} />
                  Your browser does not support the video tag.
                </video>
              )}
              {selectedFile && selectedFile.mimeType?.startsWith('audio/') && selectedFile.url && (
                <audio controls className="w-full">
                  <source src={selectedFile.url} type={selectedFile.mimeType} />
                  Your browser does not support the audio tag.
                </audio>
              )}
              {selectedFile && selectedFile.mimeType === 'application/pdf' && selectedFile.url && (
                <iframe
                  src={selectedFile.url}
                  className="w-full h-96"
                  title={selectedFile.name}
                />
              )}
              {selectedFile && !selectedFile.mimeType?.match(/(image|video|audio|pdf)/) && (
                <div className="text-center py-8">
                  <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <Button onClick={() => downloadFile(selectedFile)} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
