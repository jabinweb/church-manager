'use client'

import { useState, useEffect } from 'react'

// Import Tiptap dependencies
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

// UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  editable?: boolean
}

export function Editor({
  value,
  onChange,
  placeholder = 'Start writing...',
  editable = true,
}: EditorProps) {
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Fix for SSR hydration issues - ensure component is mounted
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'mx-auto my-4 rounded-md max-w-full',
        },
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    // Fix for SSR error - explicitly set immediatelyRender to false
    immediatelyRender: false,
  }, [isMounted]) // Only initialize editor after component is mounted

  // Update editor when value prop changes
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  const insertLink = () => {
    if (!linkUrl) return
    
    editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setLinkDialogOpen(false)
  }

  const insertImage = () => {
    if (!imageUrl) return
    
    editor?.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl('')
    setImageDialogOpen(false)
  }

  // Return a loading state while client-side hydration is happening
  if (!isMounted) {
    return (
      <div className="border rounded-md">
        <div className="border-b p-2 flex flex-wrap gap-1">
          {/* Placeholder toolbar buttons */}
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="h-9 w-9 rounded-md bg-gray-100 animate-pulse"></div>
          ))}
        </div>
        <div className="min-h-[400px] p-4 bg-gray-50 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      {editor && (
        <div className="border-b p-2 flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
            type="button"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
            type="button"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
            type="button"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
            type="button"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
            type="button"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
            type="button"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
            type="button"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
            type="button"
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLinkDialogOpen(!linkDialogOpen)}
            className={editor.isActive('link') ? 'bg-muted' : ''}
            type="button"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setImageDialogOpen(!imageDialogOpen)}
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              type="button"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              type="button"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Link Dialog */}
      {linkDialogOpen && (
        <div className="p-2 flex items-center border-b gap-2 bg-muted/50">
          <Input 
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertLink()}
            className="h-8"
          />
          <Button type="button" size="sm" onClick={insertLink}>
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setLinkDialogOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
      
      {/* Image Dialog */}
      {imageDialogOpen && (
        <div className="p-2 flex items-center border-b gap-2 bg-muted/50">
          <Input 
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertImage()}
            className="h-8"
          />
          <Button type="button" size="sm" onClick={insertImage}>
            Add
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setImageDialogOpen(false)}>
            Cancel
          </Button>
        </div>
      )}
      
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4"
      />
    </div>
  )
}
         
