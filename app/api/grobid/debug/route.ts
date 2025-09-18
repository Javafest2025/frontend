import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { teiXml } = await request.json()

        if (!teiXml) {
            return NextResponse.json({ error: 'teiXml is required' }, { status: 400 })
        }

        console.log('🔍 DEBUG: Parsing provided TEI XML...')

        // Import the parseTei function (you'll need to export it)
        const { XMLParser } = await import('fast-xml-parser')

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            ignoreNameSpace: false,
            parseTagValue: false,
            parseNodeValue: false,
            parseTrueNumberOnly: false,
            arrayMode: false,
            alwaysCreateTextNode: false,
            isArray: (name: string) => {
                return name === 'author'
            }
        })

        const tei = parser.parse(teiXml)

        return NextResponse.json({
            success: true,
            parsed: tei,
            keys: Object.keys(tei),
            teiKeys: tei.TEI ? Object.keys(tei.TEI) : 'No TEI root'
        })
    } catch (err) {
        console.error('❌ DEBUG parsing failed:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({
            error: 'Debug parsing failed',
            details: message
        }, { status: 500 })
    }
}
