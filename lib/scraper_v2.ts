"use server"

import { generateText, generateObject, zodSchema } from "ai"
import { openai } from "@ai-sdk/openai"
import { groq } from "@ai-sdk/groq"
import TurndownService from 'turndown'
import { z } from 'zod'

import * as he from 'he'

import 'dotenv/config'
import { create } from "domain"

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
    // Create a customized TurndownService instance
    const turndownService = new TurndownService({
        headingStyle: 'atx',       // Use # style headings
        hr: '---',                 // Use --- for horizontal rules
        bulletListMarker: '-',     // Use - for bullet lists
        codeBlockStyle: 'fenced',  // Use ``` for code blocks
        emDelimiter: '_'           // Use _ for emphasis
    });
    
    // Configure turndownService to ignore certain elements
    turndownService.remove(['script', 'style', 'meta', 'noscript', 'iframe', 'form', 
                           'nav', 'footer', 'aside', 'head', 'link', 'object']);
    
    // You can add custom rules to handle specific elements
    turndownService.addRule('removeComments', {
        filter: function(node) {
            return node.nodeType === 8; // Node.COMMENT_NODE
        },
        replacement: function() {
            return '';
        }
    });
    
    // Handle empty paragraphs or divs with no content
    turndownService.addRule('skipEmptyBlocks', {
        filter: ['p', 'div'],
        replacement: function(content) {
            if (!content.trim()) return '';
            return '\n\n' + content + '\n\n';
        }
    });

    // Process the HTML and convert to markdown
    const markdown = turndownService.turndown(html);
    
    // Additional post-processing to clean up the markdown
    return markdown
        .replace(/\n{3,}/g, '\n\n')           // Replace multiple consecutive line breaks with max two
        .replace(/^\s+|\s+$/g, '');           // Trim leading/trailing whitespace
}

//schema:
// [
//   [ix01, linkurl01],
//   [ix02, linkurl02],
//   ...
// ]
export async function extractLinksFromHtml(html: string, baseUrl: string) {
  const links: Array<{ label: string ; url: string; }> = [];
  // Updated regex to capture both href and the content between opening and closing tags
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g;
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    let link = match[1];
    const text = he.decode(match[2].replace(/<[^>]*>/g, '').trim()); // Remove any nested HTML tags and trim
    
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
          links.push({  label: text, url: link, });
        }
      }
    } catch (error) {
      // Skip invalid URLs
      console.error("Invalid URL:", link);
    }
  }
  
  return links;
}

//output schema: (sparse)
// {
//   highRelevance: "10-30, 3, 9"  <-- highest relevance will be preselected, ai ranks left to right for relv
//   midRelevance: "5-8, 1" <-- mid relevance will be listed second, but not preselected
// } <-- all others are not selected, not sorted. (i.e., no "low relevance" category)
export async function aiRecommendTargetLinks(guidance: string, linklist: {label: string, url: string}[], url: string, markdown: string, html: string){
    
    // converts list to: [index (inferred), label, url]
    const linklistFormatted = linklist.map((link: any, index: any) => [index, link.label, link.url]);

    const schema = z.object({
        high_confidence: z.string().describe("A list of indexes and index ranges of highly relevant links, ranked left to right for relevance. These links will be preselected for the user and placed at the top. Example: '10-20, 3, 90' means link #10 through #20 (inclusive) are most relevant, followed by link #3, and so on."),
        mid_confidence: z.string().describe("A list of indexes and index ranges of moderately relevant links, ranked left to right for relevance. These links will be listed second, but not preselected. Example: '30, 40-45, 7' means link #30 is moderately relevant, followed by links #40 through #45 (inclusive), and link #7.")
    });

    const repeatPrompt = `
    User Guidance: ${guidance}
    
    Respond only with valid JSON that matches the schema provided.
    `

    const prompt = `You are an AI assistant tasked with recommending target links from a list based on the guidance below provided by the user:
    ---
    ${repeatPrompt}
    ---
    Here is the list of links extracted from the page at ${url}:
    ${JSON.stringify(linklistFormatted, null, 2)}
    ---
    ${repeatPrompt}
    ---
    Here is the Markdown content of the page:
    ${markdown}
    ---
    ${repeatPrompt}
    ---
    Here is the HTML content of the page:
    ${html}
    ---
    ${repeatPrompt}
    ---
    
    `
    console.log(schema.shape)
    const obj = await generateObject({
        // model: groq("llama-3.1-8b-instant"),
        model: openai("gpt-4o"),
        prompt: prompt,
        schema: zodSchema(schema),
        temperature: 0.0,
    });
    //gpt-4o's cleverness was required here. 

    return obj.object;
    
}

export async function unpackAIRecommends(recs: any, linklist: {label: string, url: string}[]) {
    // Unpack the AI recommendations into a more usable format
    const highRelevance = recs.high_confidence.split(',').map((item: string) => item.trim());
    const midRelevance = recs.mid_confidence.split(',').map((item: string) => item.trim());

    const highLinks = highRelevance.map((ix: string) => {
        const [start, end] = ix.split('-').map(Number);
        if (end !== undefined) {
            return linklist.slice(start, end + 1);
        }
        return linklist[start];
    }).flat();

    const midLinks = midRelevance.map((ix: string) => {
        const [start, end] = ix.split('-').map(Number);
        if (end !== undefined) {
            return linklist.slice(start, end + 1);
        }
        return linklist[start];
    }).flat();

    // infer unused links from linklist
    const usedLinks = new Set([...highRelevance, ...midRelevance].flatMap(ix => {
        const [start, end] = ix.split('-').map(Number);
        return end !== undefined ? Array.from({ length: end - start + 1 }, (_, i) => start + i) : [start];
    }));
    const remainingLinks = linklist.filter((_, index) => !usedLinks.has(index));

    return { highLinks, midLinks, remainingLinks };
}



export async function discoverAndGatherLinks(url: string, userGuidance: string) {

    console.log("Fetching HTML content from URL:", url)
    var html = await fetchUrlHtmlContent(url)

    console.log("Extracting Markdown from HTML content")
    var markdown = await extractMarkdownFromHtml(html)

    console.log("Extracting links from HTML content")
    var links = await extractLinksFromHtml(html, url)

    console.log("Generating link selection recommendations")
    var recs = await aiRecommendTargetLinks(userGuidance, links, url, markdown, html)

    console.log("Applying AI recommendations to list", recs)
    var unpacked = await unpackAIRecommends(recs, links)

    return unpacked;
}

// Function to create a dynamic Zod schema from user-defined headers
export async function createDynamicSchema(headers: string[]) {
  const schemaObj: Record<string, any> = {};

  headers.forEach(header => {
    // Create a basic string schema for each header
    // Convert header to a valid schema key
    const schemaKey = header.trim().replace(/\s+/g, '_').toLowerCase();
    // Use optional string to handle potential missing data
    schemaObj[schemaKey] = z.string().describe(`Data for ${header}`);
  });

  return z.object(schemaObj);
}


export async function aiExtractTargetData(
  headers: string[],
  extractionGuidance: string | undefined,
  pageLink: { label: string, url: string },
  pageMarkdown: string,
  pageHtml: string
) {
  try {
    // Create a dynamic schema based on the headers
    const dynamicSchema = await createDynamicSchema(headers);

    const repeatPrompt = `
    Information to extract: ${headers.join(", ")}

    Extraction Guidance: ${extractionGuidance || ""}
    
    Respond only with valid JSON that matches the schema provided.
    For numbers, do not include commas or currency symbols.
    For dates, use ISO format (YYYY-MM-DD).
    `

    const prompt = `You are an AI assistant tasked with extracting data from a webpage based on the provided schema.
    
    Page URL: ${pageLink.label} : ${pageLink.url}
    ---
    ${repeatPrompt}
    ---
    Page Markdown:
    ${pageMarkdown}
    ---
    ${repeatPrompt}
    ---
    Page HTML:
    ${pageHtml}
    ---
    ${repeatPrompt}    
    `

    // Use AI to extract data based on schema
    const result = await generateObject({
      //model: groq("llama-3.1-8b-instant"),
      model: openai("gpt-4o"), // Using more capable model for extraction
      prompt: prompt,
      schema: zodSchema(dynamicSchema),
      temperature: 0.0,
    });

    // Convert schema keys back to original headers
    const finalResult: Record<string, any> = {};

    // Add the URL to the result for display in the table
    if (!headers.includes('url')) {
      finalResult['link_label'] = he.decode(pageLink.label);
      finalResult['link_url'] = pageLink.url; // Add raw URL for reference
    }

    headers.forEach(header => {
      const schemaKey = header.trim().replace(/\s+/g, '_').toLowerCase();
      finalResult[header] = result.object[schemaKey] ? he.decode(result.object[schemaKey]) : null;
    });

    

    return finalResult;
  } catch (error) {
    console.error(`Error extracting data from ${pageLink.url}:`, error);
    
    // Fallback response with error information
    const fallbackResult: Record<string, any> = {};
    headers.forEach(header => {
      fallbackResult[header] = null;
    });
    fallbackResult['url'] = pageLink.url;
    fallbackResult['error'] = `Failed to extract: ${(error as Error).message}`;
    
    return fallbackResult;
  }
}

// Function to process multiple selected links and extract data
export async function processSelectedLinks(
  columnHeaders: string[],
  userGuidance: string,
  linkList: Array<{ label: string, url: string }>
) {
  const results = [];
  
  for (const link of linkList) {
    try {
      console.log(`Processing link: ${link.url}`);
      const html = await fetchUrlHtmlContent(link.url);
      const markdown = await extractMarkdownFromHtml(html);
      
      const extractedData = await aiExtractTargetData(
        columnHeaders,
        userGuidance,
        link,
        markdown,
        html
      );
      
      results.push(extractedData);
    } catch (error) {
      console.error(`Error processing ${link.url}:`, error);
      
      // Add error entry
      const errorResult: Record<string, any> = {};
      columnHeaders.forEach(header => {
        errorResult[header] = null;
      });
      errorResult['url'] = link.url;
      errorResult['error'] = `Processing failed: ${(error as Error).message}`;
      
      results.push(errorResult);
    }
  }
  
  return results;
}


async function testMe(){
    //testing
    var url = await "https://www.restaurantbusinessonline.com/top-500-2025-ranking"
    console.log(url)

    var userGuidance = "Select the links most likely to contain data about specific individual restaurants in the top 500. Skip anything that doesn't link to a specific restaurant page."

    var html = await fetchUrlHtmlContent(url)
    // console.log("Fetched HTML content from URL:", url)

    var markdown = await extractMarkdownFromHtml(html)
    // console.log("Extracted Markdown:", markdown)

    var links = await extractLinksFromHtml(html, url)
    // console.log("Extracted links:", links)

    // real ai call
    // var recs = await aiRecommendTargetLinks(userGuidance, links, url, markdown, html)

    // dummy result
    var recs = {
        high_confidence: "38-87",
        mid_confidence: "12, 98, 88-97"
    }
    console.log("AI Recommendations:", recs)

    var unpacked = await unpackAIRecommends(recs, links)
    // console.log(unpacked)

    var selected = unpacked.highLinks
    // console.log("Selected links:", selected)

    var recommendedLinks = await discoverAndGatherLinks(url, userGuidance);
    console.log("Recommended links:", recommendedLinks);


    var headers = ["name", "revenue", "rank", "location", "type"];
    var extractionGuidance = "You'll need to infer rank from the pagination data on the page, as it is not with the rest of the information.";


    var dynamicSchema = await createDynamicSchema(headers);
    console.log("Dynamic Zod schema created:", dynamicSchema.shape);

    var firstSelectedLink = selected[0];
    // console.log("First selected link:", firstSelectedLink);
    var firstSelectedHtml = await fetchUrlHtmlContent(firstSelectedLink.url);
    // console.log("Fetched HTML content for first selected link:", firstSelectedLink.url);
    var firstSelectedMarkdown = await extractMarkdownFromHtml(firstSelectedHtml);
    // console.log("Extracted Markdown for first selected link:", firstSelectedMarkdown);

    var firstResult = await aiExtractTargetData(
    headers,
    extractionGuidance,
    selected[0],
    firstSelectedMarkdown,
    firstSelectedHtml
    );

    console.log("First result:", firstResult);

    var results = await processSelectedLinks(
        headers,
        extractionGuidance,
        selected.slice(0,10)
    );
    console.log("Processed results:", results);

}


// testMe().catch(console.error);
