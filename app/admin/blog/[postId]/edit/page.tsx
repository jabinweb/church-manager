import { Metadata } from "next"
import BlogPostForm from "@/components/admin/BlogPostForm"

export const metadata: Metadata = {
  title: "Edit Blog Post",
  description: "Edit an existing blog post."
}

export default function EditBlogPostPage({ params }: { params: { postId: string } }) {
  return <BlogPostForm postId={params.postId} />
}
