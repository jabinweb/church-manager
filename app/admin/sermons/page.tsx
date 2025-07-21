'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Mic, 
  Plus, 
  Search, 
  Play,
  Download,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Sermon {
  id: string
  title: string
  speaker: string
  series: string | null
  date: string
  duration: string | null
  views: number
  isPublished: boolean
  audioUrl: string | null
  videoUrl: string | null
  createdAt: string
}

interface SermonStats {
  totalSermons: number
  thisMonthSermons: number
  totalViews: number
  avgDuration: string
}

export default function SermonsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sermons, setSermons] = useState<Sermon[]>([])
  const [stats, setStats] = useState<SermonStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSermon, setEditingSermon] = useState<Sermon | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkEdit, setBulkEdit] = useState(false)
  const [bulkForm, setBulkForm] = useState<any>({ isPublished: true })
  const formRef = useRef<HTMLFormElement>(null)

  const fetchSermonsData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/sermons?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch sermons data')
      
      const data = await response.json()
      setSermons(data.sermons)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchSermonsData()
  }, [fetchSermonsData])

  const statsData = stats ? [
    { title: 'Total Sermons', value: stats.totalSermons.toString(), icon: Mic, color: 'text-blue-600' },
    { title: 'This Month', value: stats.thisMonthSermons.toString(), icon: Plus, color: 'text-green-600' },
    { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600' },
    { title: 'Avg Duration', value: stats.avgDuration, icon: Clock, color: 'text-orange-600' },
  ] : []

  // Quick edit handlers
  const openEdit = (sermon: Sermon) => {
    setEditingSermon(sermon)
    setEditForm({
      title: sermon.title,
      speaker: sermon.speaker,
      series: sermon.series || '',
      date: sermon.date,
      duration: sermon.duration || '',
      isPublished: sermon.isPublished,
      audioUrl: sermon.audioUrl || '',
      videoUrl: sermon.videoUrl || '',
      // Add more fields as needed
    })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleEditCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.checked
    }))
  }

  const saveEdit = async () => {
    if (!editingSermon) return
    setSaving(true)
    try {
      // Normalize YouTube URLs if needed
      let videoUrl = editForm.videoUrl || ''
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        // Convert to embeddable format if not already
        const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
        if (ytMatch && ytMatch[1]) {
          videoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
        }
      }
      const res = await fetch(`/api/admin/sermons/${editingSermon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          videoUrl,
          audioUrl: editForm.audioUrl || ''
        })
      })
      if (res.ok) {
        fetchSermonsData()
        setEditingSermon(null)
      }
    } catch (err) {
      // handle error
    } finally {
      setSaving(false)
    }
  }

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }
  const selectAll = () => setSelectedIds(sermons.map((s) => s.id))
  const deselectAll = () => setSelectedIds([])

  // Bulk edit handler
  const handleBulkEdit = async () => {
    setSaving(true)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/sermons/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bulkForm),
          })
        )
      )
      fetchSermonsData()
      setBulkEdit(false)
      setSelectedIds([])
    } catch (err) {
      // handle error
    } finally {
      setSaving(false)
    }
  }

  // Action handlers
  const handlePreview = (sermon: Sermon) => {
    if (sermon.videoUrl) {
      window.open(sermon.videoUrl, '_blank')
    } else if (sermon.audioUrl) {
      window.open(sermon.audioUrl, '_blank')
    }
  }

  const handleDownload = (sermon: Sermon) => {
    if (sermon.audioUrl) {
      window.open(sermon.audioUrl, '_blank')
    } else if (sermon.videoUrl) {
      window.open(sermon.videoUrl, '_blank')
    }
  }

  const handleDelete = async (sermon: Sermon) => {
    if (!window.confirm(`Are you sure you want to delete "${sermon.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/sermons/${sermon.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchSermonsData()
      }
    } catch (err) {
      // handle error
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading sermons data: {error}</p>
          <Button onClick={fetchSermonsData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sermon Management</h1>
          <p className="text-gray-600 mt-2">Manage sermon uploads, series, and content</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <Link href="/admin/sermons/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload Sermon
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsData.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sermons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading sermons...</span>
            </div>
          ) : sermons.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sermons found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="p-2">
                      <Checkbox
                        checked={selectedIds.length === sermons.length && sermons.length > 0}
                        onCheckedChange={(checked) => (checked ? selectAll() : deselectAll())}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="p-2 text-left">Title</TableHead>
                    <TableHead className="p-2 text-left">Speaker</TableHead>
                    <TableHead className="p-2 text-left">Series</TableHead>
                    <TableHead className="p-2 text-left">Date</TableHead>
                    <TableHead className="p-2 text-left">Duration</TableHead>
                    <TableHead className="p-2 text-left">Views</TableHead>
                    <TableHead className="p-2 text-left">Status</TableHead>
                    <TableHead className="p-2 text-left">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sermons.map((sermon) => (
                    <TableRow key={sermon.id} className="border-b hover:bg-gray-50">
                      <TableCell className="p-2">
                        <Checkbox
                          checked={selectedIds.includes(sermon.id)}
                          onCheckedChange={() => toggleSelect(sermon.id)}
                          aria-label="Select sermon"
                        />
                      </TableCell>
                      <TableCell className="p-2 font-medium">{sermon.title}</TableCell>
                      <TableCell className="p-2">{sermon.speaker}</TableCell>
                      <TableCell className="p-2">{sermon.series}</TableCell>
                      <TableCell className="p-2">{new Date(sermon.date).toLocaleDateString()}</TableCell>
                      <TableCell className="p-2">{sermon.duration}</TableCell>
                      <TableCell className="p-2">{sermon.views}</TableCell>
                      <TableCell className="p-2">
                        <Badge variant={sermon.isPublished ? 'default' : 'secondary'}>
                          {sermon.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => handlePreview(sermon)}>
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/sermons/${sermon.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(sermon)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(sermon)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Dialog open={editingSermon?.id === sermon.id} onOpenChange={open => !open && setEditingSermon(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={e => { e.stopPropagation(); openEdit(sermon) }}
                                title="Quick Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Sermon</DialogTitle>
                              </DialogHeader>
                              <form ref={formRef} className="space-y-4" onSubmit={e => { e.preventDefault(); saveEdit() }}>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Title</label>
                                  <Input name="title" value={editForm.title || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Speaker</label>
                                  <Input name="speaker" value={editForm.speaker || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Series</label>
                                  <Input name="series" value={editForm.series || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Date</label>
                                  <Input name="date" type="date" value={editForm.date?.slice(0, 10) || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Duration</label>
                                  <Input name="duration" value={editForm.duration || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Audio URL</label>
                                  <Input name="audioUrl" value={editForm.audioUrl || ''} onChange={handleEditChange} />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Video URL (YouTube or direct)</label>
                                  <Input name="videoUrl" value={editForm.videoUrl || ''} onChange={handleEditChange} />
                                  <span className="text-xs text-gray-500">YouTube links will be auto-converted to embed format.</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={!!editForm.isPublished}
                                    onChange={handleEditCheckbox}
                                    id="isPublished"
                                  />
                                  <label htmlFor="isPublished" className="text-sm">Published</label>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save'}
                                  </Button>
                                  <Button type="button" variant="outline" onClick={() => setEditingSermon(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
