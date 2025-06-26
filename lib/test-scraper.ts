import TurndownService from 'turndown'

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

