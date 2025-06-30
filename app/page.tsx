"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { TagInput } from "@/components/ui/tag-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, ExternalLink } from "lucide-react"
import { fetchUrlContent, processUrl } from "@/lib/scraper"
import ResultsTable from "@/components/results-table"

export default function WebScraper() {
  const [url, setUrl] = useState("https://www.restaurantbusinessonline.com/top-500-2025-ranking")
  const [loading, setLoading] = useState(false)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const [links, setLinks] = useState<{ url: string; checked: boolean }[]>([])
  const [columnHeaders, setColumnHeaders] = useState<string[]>([])
  const [extractionGuidance, setExtractionGuidance] = useState("")
  const [processingLinks, setProcessingLinks] = useState(false)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    try {
      const { content, extractedLinks } = await fetchUrlContent(url)
      setLinks(extractedLinks.map((link) => ({ url: link, checked: false })))
      setInitialFetchDone(true)
    } catch (error) {
      console.error("Error fetching URL:", error)
      alert("Failed to fetch URL. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleLinkSelection = (index: number) => {
    const updatedLinks = [...links]
    updatedLinks[index].checked = !updatedLinks[index].checked
    setLinks(updatedLinks)
  }

  const selectAllLinks = (select: boolean) => {
    setLinks(links.map((link) => ({ ...link, checked: select })))
  }

  const startProcessing = async () => {
    if (columnHeaders.length === 0) {
      alert("Please enter column headers")
      return
    }

    const headers = columnHeaders // No need to split since it's already an array

    const selectedLinks = links.filter((link) => link.checked).map((link) => link.url)
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

      // Process links in parallel within each batch
      const batchPromises = batchLinks.map((link) =>
        processUrl(link, headers, extractionGuidance)
          .then((data) => {
            setResults((prev) => [...prev, { url: link, ...data }])
            return data
          })
          .catch((error) => {
            console.error(`Error processing ${link}:`, error)
            setResults((prev) => [...prev, { url: link, error: "Failed to process" }])
            return null
          }),
      )

      await Promise.all(batchPromises)
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
    // In a production app, you'd want to use a proper Excel library
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

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Web Scraper Assistant</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Step 1: Enter URL to Scrape</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching
                </>
              ) : (
                "Fetch"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {initialFetchDone && (
        <>
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Step 2: Select Links to Process ({links.length} found)</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectAllLinks(true)}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectAllLinks(false)}>
                  Deselect All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto border bg-background rounded-md p-4">
                {links.length > 0 ? (
                  <ul className="space-y-2">
                    {links.map((link, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Checkbox
                          id={`link-${index}`}
                          checked={link.checked}
                          onCheckedChange={() => toggleLinkSelection(index)}
                        />
                        <label
                          htmlFor={`link-${index}`}
                          className="flex-1 text-sm cursor-pointer flex items-center gap-1 truncate text-foreground"
                        >
                          {link.url}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} />
                          </a>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center">No links found</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Define Column Headers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <TagInput
                  placeholder="Type column headers and press Enter (e.g. Name, Description, Price)"
                  tags={columnHeaders}
                  setTags={setColumnHeaders}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter or comma to add a header, Backspace to remove
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="extraction-guidance" className="block text-sm font-medium mb-1">
                  Extraction Guidance (Optional)
                </label>
                <Textarea
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
                disabled={processingLinks || links.filter((l) => l.checked).length === 0}
                className="w-full"
              >
                {processingLinks ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Batch {currentBatch} of {Math.ceil(links.filter((l) => l.checked).length / 5)}
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
