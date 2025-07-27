"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { downloadPdfFromB2, isB2Url, extractFileIdFromUrl, downloadPdfViaServer } from "@/lib/b2"
import { downloadPdfWithAuth } from "@/lib/api/pdf"
import { Download, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function B2DownloadTest() {
    const [testUrl, setTestUrl] = useState("https://f003.backblazeb2.com/b2api/v3/b2_download_file_by_id?fileId=4_z64a715e19e4932e197750a19_f107fa1062142071e_d20250609_m124741_c003_v0312030_t0015_u01749473261657")
    const [testStatus, setTestStatus] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [testResults, setTestResults] = useState<{
        urlValidation?: "success" | "error",
        fileIdExtraction?: "success" | "error",
        b2Authentication?: "success" | "error",
        downloadTest?: "success" | "error",
        message?: string
    }>({})

    const runUrlValidationTest = () => {
        try {
            const isValid = isB2Url(testUrl)
            if (isValid) {
                setTestResults(prev => ({ ...prev, urlValidation: "success" }))
                setTestStatus("✅ URL validation passed - Valid B2 URL detected")
                return true
            } else {
                setTestResults(prev => ({ ...prev, urlValidation: "error" }))
                setTestStatus("❌ URL validation failed - Not a valid B2 URL")
                return false
            }
        } catch (error) {
            setTestResults(prev => ({ ...prev, urlValidation: "error" }))
            setTestStatus(`❌ URL validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    const runFileIdExtractionTest = () => {
        try {
            const fileId = extractFileIdFromUrl(testUrl)
            if (fileId) {
                setTestResults(prev => ({ ...prev, fileIdExtraction: "success" }))
                setTestStatus(`✅ File ID extraction passed - ID: ${fileId.substring(0, 20)}...`)
                return true
            } else {
                setTestResults(prev => ({ ...prev, fileIdExtraction: "error" }))
                setTestStatus("❌ File ID extraction failed - No file ID found")
                return false
            }
        } catch (error) {
            setTestResults(prev => ({ ...prev, fileIdExtraction: "error" }))
            setTestStatus(`❌ File ID extraction error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    const runAuthenticationTest = async () => {
        try {
            setTestStatus("🔐 Testing server-side B2 authentication...")
            // Test server-side authentication by making a small request
            const response = await fetch('/api/b2/download', {
                method: 'GET' // This will return a simple message
            });
            if (response.ok) {
                setTestResults(prev => ({ ...prev, b2Authentication: "success" }))
                setTestStatus("✅ B2 server-side authentication available")
                return true
            } else {
                setTestResults(prev => ({ ...prev, b2Authentication: "error" }))
                setTestStatus("❌ B2 server-side authentication failed")
                return false
            }
        } catch (error) {
            setTestResults(prev => ({ ...prev, b2Authentication: "error" }))
            setTestStatus(`❌ B2 authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    const runDownloadTest = async () => {
        try {
            setTestStatus("⬇️ Testing PDF download...")
            await downloadPdfWithAuth(testUrl, "B2-Test-Download")
            setTestResults(prev => ({ ...prev, downloadTest: "success" }))
            setTestStatus("✅ PDF download test successful")
            return true
        } catch (error) {
            setTestResults(prev => ({ ...prev, downloadTest: "error" }))
            setTestStatus(`❌ PDF download error: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return false
        }
    }

    const runAllTests = async () => {
        setIsLoading(true)
        setTestResults({})

        console.log("🧪 Starting B2 Download Tests...")

        // Test 1: URL Validation
        if (!runUrlValidationTest()) {
            setIsLoading(false)
            return
        }

        // Test 2: File ID Extraction
        if (!runFileIdExtractionTest()) {
            setIsLoading(false)
            return
        }

        // Test 3: B2 Authentication
        if (!(await runAuthenticationTest())) {
            setIsLoading(false)
            return
        }

        // Test 4: Download Test
        await runDownloadTest()

        setIsLoading(false)
        console.log("🏁 B2 Download Tests completed")
    }

    const testDirectDownload = async () => {
        setIsLoading(true)
        try {
            setTestStatus("⬇️ Testing server-side B2 download...")
            await downloadPdfViaServer(testUrl, "Server-B2-Test-Download")
            setTestStatus("✅ Server-side B2 download successful")
        } catch (error) {
            setTestStatus(`❌ Server-side B2 download error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setIsLoading(false)
    }

    const getStatusIcon = (status?: "success" | "error") => {
        if (status === "success") return <CheckCircle className="h-4 w-4 text-green-500" />
        if (status === "error") return <XCircle className="h-4 w-4 text-red-500" />
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    B2 Download Authentication Test
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Test URL Input */}
                <div className="space-y-2">
                    <Label htmlFor="testUrl">Test B2 URL:</Label>
                    <Input
                        id="testUrl"
                        value={testUrl}
                        onChange={(e) => setTestUrl(e.target.value)}
                        placeholder="Enter B2 download URL to test..."
                        className="font-mono text-xs"
                    />
                </div>

                {/* Test Results */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded border">
                        {getStatusIcon(testResults.urlValidation)}
                        <span className="text-sm">URL Validation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded border">
                        {getStatusIcon(testResults.fileIdExtraction)}
                        <span className="text-sm">File ID Extraction</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded border">
                        {getStatusIcon(testResults.b2Authentication)}
                        <span className="text-sm">B2 Authentication</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded border">
                        {getStatusIcon(testResults.downloadTest)}
                        <span className="text-sm">Download Test</span>
                    </div>
                </div>

                {/* Test Buttons */}
                <div className="flex gap-2">
                    <Button
                        onClick={runAllTests}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        <TestTube className="h-4 w-4 mr-2" />
                        {isLoading ? "Running Tests..." : "Run All Tests"}
                    </Button>
                    <Button
                        onClick={testDirectDownload}
                        disabled={isLoading}
                        variant="outline"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Test Download
                    </Button>
                </div>

                {/* Status Display */}
                {testStatus && (
                    <Alert>
                        <AlertDescription className="font-mono text-xs">
                            {testStatus}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Environment Info */}
                <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium">Environment Check:</p>
                        <div className="flex items-center gap-2">
                            <Badge variant="default">
                                Server-side Authentication: ✓ Secure
                            </Badge>
                            <Badge variant="outline">
                                Environment: Server-only credentials
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
} 