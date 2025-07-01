"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TagInput } from "@/components/ui/tag-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, ExternalLink } from "lucide-react"
import { discoverAndGatherLinks, fetchUrlHtmlContent, extractMarkdownFromHtml, processSelectedLinks } from "@/lib/scraper_v2"
import ResultsTable from "@/components/results-table"

export default function WebScraper() {
  const [url, setUrl] = useState("https://www.restaurantbusinessonline.com/top-500-2025-ranking")
  const [userGuidance, setUserGuidance] = useState("Select the links most likely to contain data about specific individual restaurants in the top 500. Skip things that don't link directly to pages about individual restaurants.")
  const [loading, setLoading] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const [pageMarkdown, setPageMarkdown] = useState("")
  
  // Link selection states
  const [highRelevanceLinks, setHighRelevanceLinks] = useState<Array<{ label: string, url: string, checked: boolean }>>([])
  const [midRelevanceLinks, setMidRelevanceLinks] = useState<Array<{ label: string, url: string, checked: boolean }>>([])
  const [remainingLinks, setRemainingLinks] = useState<Array<{ label: string, url: string, checked: boolean }>>([])
  
  // Data extraction states
  const [columnHeaders, setColumnHeaders] = useState<string[]>(["name","revenue(millions)","rank","locations","category"])
  const [extractionGuidance, setExtractionGuidance] = useState("rank is equivalent to the page number, so search for it there, not with the rest of the data")
  const [processingLinks, setProcessingLinks] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    try {
      // Fetch HTML and create markdown preview
      const html = await fetchUrlHtmlContent(url)
      const markdown = await extractMarkdownFromHtml(html)
      setPageMarkdown(markdown)
      
      // Process and recommend links
      const { highLinks, midLinks, remainingLinks: otherLinks } = await discoverAndGatherLinks(url, userGuidance)
      
      // Set links with checked state (high relevance pre-checked)
      setHighRelevanceLinks(highLinks.map((link: any) => ({ ...link, checked: true })))
      setMidRelevanceLinks(midLinks.map((link: any) => ({ ...link, checked: false })))
      setRemainingLinks(otherLinks.map(link => ({ ...link, checked: false })))
      
      setInitialFetchDone(true)
    } catch (error) {
      console.error("Error fetching URL:", error)
      alert("Failed to fetch URL. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleLinkSelection = (index: number, category: 'high' | 'mid' | 'remaining') => {
    if (category === 'high') {
      const updated = [...highRelevanceLinks]
      updated[index].checked = !updated[index].checked
      setHighRelevanceLinks(updated)
    } else if (category === 'mid') {
      const updated = [...midRelevanceLinks]
      updated[index].checked = !updated[index].checked
      setMidRelevanceLinks(updated)
    } else {
      const updated = [...remainingLinks]
      updated[index].checked = !updated[index].checked
      setRemainingLinks(updated)
    }
  }

  const selectAllLinks = (category: 'high' | 'mid' | 'remaining', select: boolean) => {
    if (category === 'high') {
      setHighRelevanceLinks(highRelevanceLinks.map(link => ({ ...link, checked: select })))
    } else if (category === 'mid') {
      setMidRelevanceLinks(midRelevanceLinks.map(link => ({ ...link, checked: select })))
    } else {
      setRemainingLinks(remainingLinks.map(link => ({ ...link, checked: select })))
    }
  }

  const startProcessing = async () => {
    if (columnHeaders.length === 0) {
      alert("Please enter column headers")
      return
    }

    // Get all checked links
    const selectedLinks = [
      ...highRelevanceLinks.filter(link => link.checked),
      ...midRelevanceLinks.filter(link => link.checked),
      ...remainingLinks.filter(link => link.checked)
    ]
    
    if (selectedLinks.length === 0) {
      alert("Please select at least one link to process")
      return
    }

    setProcessingLinks(true)
    setResults([])

    // Process links in batches of 5
    const batchSize = 5
    const batches = Math.ceil(selectedLinks.length / batchSize)

    for (let i = 0; i < batches; i++) {
      setCurrentBatch(i + 1)
      const batchLinks = selectedLinks.slice(i * batchSize, (i + 1) * batchSize)

      try {
        // Process links in parallel within each batch
        const batchResults = await processSelectedLinks(
          columnHeaders,
          extractionGuidance,
          batchLinks
        )
        
        setResults(prev => [...prev, ...batchResults])
      } catch (error) {
        console.error(`Error processing batch ${i + 1}:`, error)
      }
    }

    setProcessingLinks(false)
  }

  const downloadCSV = () => {
    if (results.length === 0) return

    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join(","),
      ...results.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || ""
            // Escape quotes and wrap in quotes if contains comma or newline
            return typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "scraped_data.csv")
    link.click()
  }

  const downloadXLS = () => {
    // For simplicity, we'll use CSV with .xls extension
    if (results.length === 0) return

    const headers = Object.keys(results[0])
    const csvContent = [
      headers.join("\t"),
      ...results.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || ""
            return typeof value === "string" ? value.replace(/\t/g, " ") : value
          })
          .join("\t"),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "scraped_data.xls")
    link.click()
  }

  // Helper function to render link lists
  const renderLinkList = (links: Array<{ label: string, url: string, checked: boolean }>, category: 'high' | 'mid' | 'remaining') => {
    return (
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index} className="flex items-center gap-2">
            <Checkbox
              id={`${category}-link-${index}`}
              checked={link.checked}
              onCheckedChange={() => toggleLinkSelection(index, category)}
            />
            <label
              htmlFor={`${category}-link-${index}`}
              className="flex-1 text-sm cursor-pointer flex items-center gap-1 truncate text-foreground"
            >
              <span className="truncate">{link.label || link.url}</span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            </label>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">SkellyScrape💀✨🔮📑</h1>
      <Card className="mb-6 bg-purple-950">
        <CardHeader>
          <h1 className="text-2xl font-bold mb-2">Phase 1: Discover and Select Links</h1>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mt-1 mb-2"><em>
          Finding relevant links on a root page, preselected by AI, finalized by the user.  
        </em></p>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Enter URL & Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="url-input" className="block text-m font-medium mb-1 text-pink-400">
                Link extraction URL
              </label>
              <p className="text-xs text-muted-foreground mt-1 mb-1 text-pink-300"><em>
                Any page that contains several links to pages containing data to be extracted.  
              </em></p>
              <Input
                className="bg-pink-800"
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="guidance-input" className="block text-m font-medium mb-1 text-pink-400">
                Pre-Selection Guidance (AI)
              </label>
              <p className="text-xs text-muted-foreground mt-1 mb-1 text-pink-300"><em>
                Any criteria you want to give the AI for identifying relevant links on the page.
              </em></p>
              <Textarea
                className="bg-pink-800"
                id="guidance-input"
                placeholder="Describe what kind of pages you're looking for. Example: Select links that lead to product detail pages."
                value={userGuidance}
                onChange={(e) => setUserGuidance(e.target.value)}
                rows={2}
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching & Analyzing
                </>
              ) : (
                "Fetch & Analyze Page"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {initialFetchDone && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Text Preview</CardTitle>
                <p className="text-xs text-muted-foreground mt-1"><em>
                  Text extracted directly from the page.
                </em></p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[240px] w-full rounded-md border p-4 bg-gray-700 text-gray-400">
                  <div className="prose prose-sm dark:prose-invert">
                    {pageMarkdown ? (
                      <div className="whitespace-pre-wrap">{pageMarkdown}</div>
                    ) : (
                      <p className="text-muted-foreground">No content available</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Step 2: Select Links to Process</CardTitle>
                <p className="text-xs text-muted-foreground mt-1"><em>
                  Decide which links to send on to the AI for initial data extraction.
                </em></p>
              </CardHeader>
              <CardContent className="space-y-4">
                {highRelevanceLinks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-m font-semibold text-fuchsia-400">Preselected ({highRelevanceLinks.length})</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-1 text-fuchsia-300"><em>
                        Links the AI identified as aligning most closely with the user's guidance for preselection.
                      </em></p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('high', true)}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('high', false)}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[150px] w-full bg-fuchsia-950 rounded-md border p-4">
                      {renderLinkList(highRelevanceLinks, 'high')}
                    </ScrollArea>
                  </div>
                )}

                {midRelevanceLinks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-m font-semibold text-cyan-400">Maybes ({midRelevanceLinks.length})</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-2 text-cyan-300"><em>
                        Links the AI identified as being semi-relevant, not preselected.
                      </em></p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('mid', true)}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('mid', false)}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[150px] w-full rounded-md border p-4 bg-cyan-950">
                      {renderLinkList(midRelevanceLinks, 'mid')}
                    </ScrollArea>
                  </div>
                )}

                {remainingLinks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-m font-semibold">Remaining ({remainingLinks.length})</h3>
                      <p className="text-xs text-muted-foreground mt-1"><em>
                        Links the AI did not identify as having any particular relevance to the preselection guidance.
                      </em></p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('remaining', true)}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => selectAllLinks('remaining', false)}>
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                      {renderLinkList(remainingLinks, 'remaining')}
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="mb-2  bg-purple-950">
            <CardHeader>          
              <h1 className="text-2xl font-bold">Phase 2: Extract Data from Links</h1>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mt-1 mb-2"><em>
                For each link selected in Phase 1, define data to be extracted by the AI, with any useful guidance the user can provide.
              </em></p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Define Data Extraction Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label htmlFor="column-headers" className="block text-m font-medium mb-1 text-pink-400">
                  Column Headers
                </label>
                <p className="text-xs text-muted-foreground mt-1 mb-1 text-pink-300"><em>
                  Meaningful names for the data fields to be extracted from each page.
                </em></p>
                <TagInput
                  id="column-headers"
                  placeholder="Type column headers and press Enter (e.g. Name, Revenue, Rank)"
                  tags={columnHeaders}
                  setTags={setColumnHeaders}
                  className="min-h-[80px] bg-pink-800"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <em>Press Enter or comma to add a header, Backspace to remove</em>
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="extraction-guidance" className="block text-m font-medium mb-1 text-pink-400">
                  Extraction Guidance (AI)
                </label>
                <p className="text-xs text-muted-foreground mt-1 mb-1 text-pink-300"><em>
                  Gudiance for how the AI should extract data from the page, things like formats, locations, how to infer or synthesize information, or other special instructions. 
                </em></p>
                <Textarea
                  className="bg-pink-800"
                  id="extraction-guidance"
                  placeholder="Provide additional guidance for the AI on how to extract data.
Example: Look for product prices in the main content area. The description is usually in the first paragraph."
                  value={extractionGuidance}
                  onChange={(e) => setExtractionGuidance(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={startProcessing}
                disabled={processingLinks || 
                  (highRelevanceLinks.filter(l => l.checked).length === 0 && 
                   midRelevanceLinks.filter(l => l.checked).length === 0 && 
                   remainingLinks.filter(l => l.checked).length === 0)}
                className="w-full"
              >
                {processingLinks ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Batch {currentBatch} of {Math.ceil(
                      (highRelevanceLinks.filter(l => l.checked).length + 
                       midRelevanceLinks.filter(l => l.checked).length + 
                       remainingLinks.filter(l => l.checked).length) / 5
                    )}
                  </>
                ) : (
                  "Start Processing Selected Links"
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results ({results.length})</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 mb-1"><em>
                Results of calls to the AI will populate here as they are processed.
              </em></p>
              <p className="text-xs text-muted-foreground mt-1 mb-1 text-red-400">
                ⚠️AI systems are prone to mistakes, so manually inspect results before treating them as a source of truth.⚠️
              </p>
            </CardHeader>
            <CardContent>
              <ResultsTable results={results} />

              {results.length > 0 && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button variant="outline" onClick={downloadXLS}>
                    <Download className="mr-2 h-4 w-4" />
                    Download XLS
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}