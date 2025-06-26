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
export async function extractLinksFromHtml(html: string){
  const links: string[] = [];
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>/g;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const link = match[1];
    
    // Skip empty links, anchors, javascript, mailto
    if (!link || link.startsWith("#") || link.startsWith("javascript:") || link.startsWith("mailto:")) {
      continue;
    }
    
    if (!links.includes(link)) {
      links.push(link);
    }
  }
  
  return links;

}

//output schema: (sparse)
// {
//   highRelevance: 10-30, 3, 9  <-- highest relevance will be preselected, ai ranks left to right for relv
//   midRelevance: 5-8, 1 <-- mid relevance will be listed second, but not preselected
// } <-- all others are not selected, not sorted. 
export async function aiRecommendTargetLinks(userGuidance, linklist, pageUrl, pageMarkdown, pageHtml){

}

export async function rearrangeLinks(linklist, aiLinkRecommends){

}

export async function discoverAndGatherLinks(baseUrl, userGuidance) {
    
}


export async function aiExtractTargetData(userGuidance, fields, pageUrl, pageMarkdown, pageHtml){

}


// top level phases



export async function processSelectedLinks(columnHeaders, userGuidance, linklist){

}