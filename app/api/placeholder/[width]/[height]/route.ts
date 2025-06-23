import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/placeholder/{width}/{height}:
 *   get:
 *     summary: Generates an SVG placeholder image.
 *     description: Creates a simple SVG image with the specified dimensions and a text label showing the dimensions.
 *     parameters:
 *       - in: path
 *         name: width
 *         required: true
 *         description: The width of the placeholder image.
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: path
 *         name: height
 *         required: true
 *         description: The height of the placeholder image.
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: An SVG placeholder image.
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid dimensions provided.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Invalid dimensions
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { width: string; height: string } }
) {
    const resolvedParams = await params;
    const width = parseInt(resolvedParams.width, 10);
    const height = parseInt(resolvedParams.height, 10);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return new NextResponse('Invalid dimensions', { status: 400 });
    }

    // Generate a simple SVG placeholder
    const svg = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${width}" height="${height}" style="fill:rgb(200,200,200)"/>
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16px" fill="#555">
                ${width}x${height}
            </text>
        </svg>
    `;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, immutable', // Cache for 1 day
        },
    });
} 