import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ params: string[] }> }
) {
  const { params: routeParams } = await params
  const [width, height] = routeParams

  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text') || 'Placeholder'
  const bg = searchParams.get('bg') || '6366f1'
  const color = searchParams.get('color') || 'white'

  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bg}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="${color}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        ${text}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
