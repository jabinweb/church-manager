import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().nullable().optional(),
  price: z.number().positive('Price must be greater than 0'),
  sku: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  stockQuantity: z.number().min(0, 'Stock quantity cannot be negative').default(0),
  isActive: z.boolean().default(true),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).default([])
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
})

export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>