"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Function to fetch URL content and extract links
export async function fetchUrlContent(url: string) {
  try {
    // Fetch the HTML content
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // We don't need content conversion anymore since we're not showing preview
    const content = ""

    // Extract links
    const extractedLinks = await extractLinks(html, url)

    return { content, extractedLinks }
  } catch (error) {
    console.error("Error in fetchUrlContent:", error)
    throw error
  }
}

// Function to convert HTML to Markdown
async function convertHtmlToMarkdown(html: string) {
  try {
    // Use AI to convert HTML to Markdown for better readability
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Convert the following HTML to clean, readable Markdown. Focus on the main content and remove navigation, ads, footers, etc:

${html.substring(0, 100000)}`, // Limit size to avoid token limits
    })

    return text
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error)
    // Fallback to simple HTML if AI conversion fails
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
}

// Function to extract links from HTML
export async function extractLinks(html: string, baseUrl: string) {
  const links: string[] = []
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/g

  let match
  while ((match = linkRegex.exec(html)) !== null) {
    let link = match[1]

    // Skip empty links, anchors, javascript, mailto
    if (!link || link.startsWith("#") || link.startsWith("javascript:") || link.startsWith("mailto:")) {
      continue
    }

    // Convert relative URLs to absolute
    if (!link.startsWith("http")) {
      const url = new URL(baseUrl)

      if (link.startsWith("/")) {
        // Absolute path
        link = `${url.protocol}//${url.host}${link}`
      } else {
        // Relative path
        const basePath = url.pathname.split("/").slice(0, -1).join("/")
        link = `${url.protocol}//${url.host}${basePath}/${link}`
      }
    }

    // Only include links from the same domain
    try {
      const baseUrlObj = new URL(baseUrl)
      const linkUrlObj = new URL(link)

      if (baseUrlObj.hostname === linkUrlObj.hostname && !links.includes(link)) {
        links.push(link)
      }
    } catch (error) {
      // Skip invalid URLs
      console.error("Invalid URL:", link)
    }
  }

  return links
}

// Function to process a URL and extract data based on column headers
export async function processUrl(url: string, headers: string[], extractionGuidance?: string) {
  try {
    // Fetch the URL content
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    // Convert HTML to Markdown
    const markdown = await convertHtmlToMarkdown(html)

    // Prepare the prompt with optional extraction guidance
    let prompt = `You are extracting data for a table. Here is a web page in Markdown:
    ---
    ${markdown.substring(0, 100000)}
    ---

    Please extract a row with the following fields:
    ${headers.map((header) => `- ${header}`).join("\n")}

    `

    // Add extraction guidance if provided
    if (extractionGuidance && extractionGuidance.trim()) {
      prompt += `Additional guidance for extraction:
    ${extractionGuidance.trim()}

    `
    }

    prompt += `IMPORTANT: Return ONLY a valid JSON array with the values in the exact order listed above. If a field is not found, use null. Do not include any explanation or additional text.

    Example format: ["value1", "value2", null, "value4"]`

    // Use AI to extract data based on column headers
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
    })

    // Parse the AI response as JSON
    try {
      // Clean the response text to extract JSON
      let cleanedText = text.trim()

      // Try to find JSON array in the response
      const jsonMatch = cleanedText.match(/\[.*\]/s)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }

      // Remove any markdown code block formatting
      cleanedText = cleanedText.replace(/```json\s*|\s*```/g, "")
      cleanedText = cleanedText.replace(/```\s*|\s*```/g, "")

      const data = JSON.parse(cleanedText)

      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Response is not an array")
      }

      // Create an object with the headers as keys
      const result: Record<string, any> = {}
      headers.forEach((header, index) => {
        result[header] = data[index] || null
      })

      return result
    } catch (error) {
      console.error("Error parsing AI response:", error)
      console.log("Raw AI response:", text)

      // If JSON parsing fails, try to extract data using a different approach
      try {
        const fallbackResult = await generateText({
          model: openai("gpt-4o"),
          prompt: `Extract data from this content for these fields: ${headers.join(", ")}

Content:
${markdown.substring(0, 50000)}

For each field, provide the value or "N/A" if not found. Format as:
${headers.map((header) => `${header}: [value]`).join("\n")}`,
        })

        // Parse the fallback response
        const result: Record<string, any> = {}
        headers.forEach((header) => {
          const regex = new RegExp(`${header}:\\s*(.+)`, "i")
          const match = fallbackResult.text.match(regex)
          result[header] = match ? match[1].trim() : "Failed to extract"
        })

        return result
      } catch (fallbackError) {
        console.error("Fallback extraction also failed:", fallbackError)

        // Final fallback - return error message for each field
        const result: Record<string, any> = {}
        headers.forEach((header) => {
          result[header] = "Failed to extract"
        })

        return result
      }
    }
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error)
    throw error
  }
}