/**
 * Script to generate a mapping of tags to ARASAAC pictogram IDs.
 * For each unique tag, finds the best matching pictogram.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ArasaacPictogram {
  _id: number;
  keywords: Array<{
    keyword: string;
    type: number;
    plural?: string;
  }>;
  categories?: string[];
  tags?: string[];
}

interface TagIconMapping {
  [tag: string]: number; // tag name -> pictogram ID
}

/**
 * Calculate match score for a pictogram against a tag name.
 * Higher score = better match.
 */
function calculateMatchScore(pictogram: ArasaacPictogram, tagName: string): number {
  let score = 0;
  const normalizedTag = tagName.toLowerCase().trim();

  // Check tags - exact match gets highest score
  if (pictogram.tags) {
    for (const tag of pictogram.tags) {
      const normalizedPictoTag = tag.toLowerCase().trim();
      if (normalizedPictoTag === normalizedTag) {
        score += 100;
      } else if (normalizedPictoTag.includes(normalizedTag) || normalizedTag.includes(normalizedPictoTag)) {
        score += 50;
      }
    }
  }

  // Check keywords - exact match gets high score
  for (const kw of pictogram.keywords) {
    const normalizedKeyword = kw.keyword.toLowerCase().trim();
    if (normalizedKeyword === normalizedTag) {
      score += 80;
    } else if (normalizedKeyword.includes(normalizedTag) || normalizedTag.includes(normalizedKeyword)) {
      score += 40;
    }

    // Also check plural form if exists
    if (kw.plural) {
      const normalizedPlural = kw.plural.toLowerCase().trim();
      if (normalizedPlural === normalizedTag) {
        score += 80;
      } else if (normalizedPlural.includes(normalizedTag) || normalizedTag.includes(normalizedPlural)) {
        score += 40;
      }
    }
  }

  // Check categories - partial match
  if (pictogram.categories) {
    for (const category of pictogram.categories) {
      const normalizedCategory = category.toLowerCase().trim();
      if (normalizedCategory === normalizedTag) {
        score += 30;
      } else if (normalizedCategory.includes(normalizedTag) || normalizedTag.includes(normalizedCategory)) {
        score += 15;
      }
    }
  }

  return score;
}

/**
 * Find the best matching pictogram for a tag name.
 */
function findBestPictogramForTag(
  tagName: string,
  pictograms: ArasaacPictogram[]
): number | null {
  let bestScore = 0;
  let bestPictogramId: number | null = null;

  for (const pictogram of pictograms) {
    const score = calculateMatchScore(pictogram, tagName);
    if (score > bestScore) {
      bestScore = score;
      bestPictogramId = pictogram._id;
    }
  }

  // Only return a match if we have a reasonable score
  return bestScore > 10 ? bestPictogramId : null;
}

async function main() {
  console.log('Loading ARASAAC pictograms...');
  
  const pictogramsPath = path.join(__dirname, '../lib/arasaac-pictograms.json');
  const pictogramsData = fs.readFileSync(pictogramsPath, 'utf-8');
  const pictograms: ArasaacPictogram[] = JSON.parse(pictogramsData);

  console.log(`Loaded ${pictograms.length} pictograms`);

  // Extract all unique tags
  const allTags = new Set<string>();
  for (const pictogram of pictograms) {
    if (pictogram.tags) {
      for (const tag of pictogram.tags) {
        allTags.add(tag.toLowerCase().trim());
      }
    }
  }

  console.log(`Found ${allTags.size} unique tags`);

  // Generate mapping
  const mapping: TagIconMapping = {};
  let matchedCount = 0;
  let index = 0;

  for (const tag of Array.from(allTags).sort()) {
    index++;
    if (index % 50 === 0) {
      console.log(`Processing tag ${index}/${allTags.size}: ${tag}`);
    }

    const pictogramId = findBestPictogramForTag(tag, pictograms);
    if (pictogramId !== null) {
      mapping[tag] = pictogramId;
      matchedCount++;
    } else {
      console.warn(`No match found for tag: ${tag}`);
    }
  }

  console.log(`\nMatched ${matchedCount}/${allTags.size} tags to pictograms`);

  // Save mapping to JSON file
  const outputPath = path.join(__dirname, '../lib/tag-icon-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8');

  console.log(`\nMapping saved to: ${outputPath}`);
  console.log(`\nSample mappings:`);
  
  const sampleTags = Array.from(allTags).sort().slice(0, 10);
  for (const tag of sampleTags) {
    if (mapping[tag]) {
      console.log(`  ${tag} -> ${mapping[tag]}`);
    }
  }
}

main().catch(console.error);
