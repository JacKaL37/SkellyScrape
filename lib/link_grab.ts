#!/usr/bin/env node

import 'dotenv/config';
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

interface Link {
  index: number;
  url: string;
}

interface TaggedLink extends Link {
  checked: boolean;
  relevance: 'highlyRelevant' | 'maybeRelevant' | 'irrelevant';
}

// Initialize OpenAI client (requires OPENAI_API_KEY in .env)
const openai = new OpenAI();

// Inputs (replace with actual content or file reads)
const webpageHTML = "<html>...</html>";
const webpageMarkdown = "# Title\n...";
const extractedLinks = [
  { index: 0, url: "https://example.com/a" },
  { index: 1, url: "https://example.com/b" },
  { index: 2, url: "https://example.com/c" },
  // ... more links
];
const userGuidance = "Prioritize articles related to AI and programming.";

// Zod schema for structured response
const LinkSelectionSchema = z.object({
  highlyRelevant: z.array(z.string()).describe(
    "Indexes or index ranges of links deemed highly relevant"
  ),
  maybeRelevant: z
    .array(z.string())
    .describe("Indexes or index ranges of links deemed possibly relevant"),
});

// Main function
async function main() {
  // Get structured selection from OpenAI
  const completion = await openai.chat.completions.parse({
    model: "gpt-4o-2024-08-06",
    messages: [
      { role: "system", content: "Evaluate and bucket link indexes by relevance." },
      {
        role: "user",
        content: `HTML:\n${webpageHTML}\n\nMarkdown:\n${webpageMarkdown}\n\nLinks:\n${JSON.stringify(
          extractedLinks
        )}\n\nGuidance:\n${userGuidance}`,
      },
    ],
    response_format: zodResponseFormat(LinkSelectionSchema, "linkSelection"),
  });

    const selection = completion.choices[0].message.parsed;

  // Add a null check before accessing properties
  if (!selection) {
    console.error("Failed to parse link selection from API response");
    process.exit(1);
  }

  // Helper: parse "1-3" into [1,2,3]
  const parseIndices = (ranges: string[]) =>
    ranges.flatMap((r) => {
      if (r.includes("-")) {
        const [start, end] = r.split("-").map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
      }
      return [Number(r)];
    });

  // Reorder and tag links
  const high = parseIndices(selection.highlyRelevant);
  const maybe = parseIndices(selection.maybeRelevant);
  const tagged = [];

  for (const idx of high) {
    const link = extractedLinks.find((l) => l.index === idx);
    if (link) tagged.push({ ...link, checked: true, relevance: "highlyRelevant" });
  }
  for (const idx of maybe) {
    const link = extractedLinks.find((l) => l.index === idx);
    if (link && !tagged.some((t) => t.index === idx))
      tagged.push({ ...link, checked: false, relevance: "maybeRelevant" });
  }
  extractedLinks.forEach((link) => {
    if (!high.includes(link.index) && !maybe.includes(link.index)) {
      tagged.push({ ...link, checked: false, relevance: "irrelevant" });
    }
  });

  console.log(tagged);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
