"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { groq } from "@ai-sdk/groq"
import TurndownService from 'turndown'

const turndownService = new TurndownService();

// Function to fetch URL content and extract links
export async function fetchUrlHtmlContent(url: string) {
  try {
    // Fetch the HTML content
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`)
    }

    const html = await response.text()

    return html
  } catch (error) {
    console.error("Error in fetchUrlContent:", error)
    throw error
  }
}

export async function extractMarkdownFromHtml(html: string){
    const markdown = turndownService.turndown(html);

    return markdown;
}

//schema:
// [
//   [ix01, linkurl01],
//   [ix02, linkurl02],
//   ...
// ]
export async function extractLinksFromHtml(html: string, baseUrl: string) {
  const links: Array<{ url: string; text: string }> = [];
  // Updated regex to capture both href and the content between opening and closing tags
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let link = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim(); // Remove any nested HTML tags and trim
    
    // Skip empty links, anchors, javascript, mailto
    if (!link || link.startsWith("#") || link.startsWith("javascript:") || link.startsWith("mailto:")) {
      continue;
    }
    
    // Convert relative URLs to absolute
    if (!link.startsWith("http")) {
      const url = new URL(baseUrl);
      if (link.startsWith("/")) {
        // Absolute path
        link = `${url.protocol}//${url.host}${link}`;
      } else {
        // Relative path
        const basePath = url.pathname.split("/").slice(0, -1).join("/");
        link = `${url.protocol}//${url.host}${basePath}/${link}`;
      }
    }
    
    // Only include links from the same domain
    try {
      const baseUrlObj = new URL(baseUrl);
      const linkUrlObj = new URL(link);
      
      if (baseUrlObj.hostname === linkUrlObj.hostname) {
        // Check if the URL already exists in our links array
        const exists = links.some(item => item.url === link);
        if (!exists) {
          links.push({ url: link, text });
        }
      }
    } catch (error) {
      // Skip invalid URLs
      console.error("Invalid URL:", link);
    }
  }
  
  return links;
}



//testing
var url = await "https://www.restaurantbusinessonline.com/top-500-2025-ranking"
console.log(url)

var html = await fetchUrlHtmlContent(url)
console.log(html)

var markdown = await extractMarkdownFromHtml(html)
console.log(markdown)

var links = await extractLinksFromHtml(html, url)
console.log(links)



//output schema: (sparse)
// {
//   highRelevance: 10-30, 3, 9  <-- highest relevance will be preselected, ai ranks left to right for relv
//   midRelevance: 5-8, 1 <-- mid relevance will be listed second, but not preselected
// } <-- all others are not selected, not sorted. (i.e., no "low relevance" category)
// export async function aiRecommendTargetLinks(userGuidance, linklist, pageUrl, pageMarkdown, pageHtml){

// }

// export async function rearrangeLinks(linklist, aiLinkRecommends){

// }

// export async function discoverAndGatherLinks(baseUrl, userGuidance) {
    
// }


// export async function aiExtractTargetData(userGuidance, fields, pageUrl, pageMarkdown, pageHtml){

// }



// export async function processSelectedLinks(columnHeaders, userGuidance, linklist){

// }
  
  