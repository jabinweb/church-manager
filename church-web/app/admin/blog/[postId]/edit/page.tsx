import { Metadata } from "next"
import BlogPostForm from "@/components/admin/BlogPostForm"

export const metadata: Metadata = {
  title: "Edit Blog Post",
  description: "Edit an existing blog post."
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  return <BlogPostForm postId={postId} />
}
