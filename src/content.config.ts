import { file } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import JSON5 from "json5";

// Both canon files wrap their list in { entries: [...] }, and neither carries
// an id — the URL is already unique per entry, so it doubles as the key. The
// checks run ahead of the schema so a malformed file names itself, rather than
// failing later as an undefined property or silently collapsing two entries
// that share a url into one.
const parseEntries =
  (source: string) =>
  (text: string): Record<string, unknown>[] => {
    const parsed: unknown = JSON5.parse(text);
    const entries = (parsed as { entries?: unknown } | null)?.entries;
    if (!Array.isArray(entries)) {
      throw new Error(`${source}: expected an { entries: [...] } array`);
    }
    const seen = new Set<string>();
    return entries.map((entry, index) => {
      const url = (entry as { url?: unknown } | null)?.url;
      if (typeof url !== "string" || url === "") {
        throw new Error(`${source}: entry ${index} has no url to key it by`);
      }
      if (seen.has(url)) {
        throw new Error(`${source}: duplicate url ${url}`);
      }
      seen.add(url);
      return { ...(entry as Record<string, unknown>), id: url };
    });
  };

// The canon pages sort on `added`, so a malformed value would sort wrong in
// silence; `published` is rendered as a year via slice(0, 4), so anything
// looser than these three shapes would print garbage.
const addedAt = z.iso.datetime();
const publishedOn = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, "expected YYYY, YYYY-MM or YYYY-MM-DD");

const sharedFields = {
  title: z.string(),
  author: z.string().optional(),
  url: z.url(),
  added: addedAt,
  excerpts: z.array(z.string()).optional(),
};

const softwareCanon = defineCollection({
  loader: file("data/software_canon.json5", {
    parser: parseEntries("data/software_canon.json5"),
  }),
  schema: z.object({
    ...sharedFields,
    type: z.enum(["book", "paper", "link", "talk"]),
    display_author: z.string().optional(),
    published: publishedOn.optional(),
    published_approximate: z.boolean().optional(),
  }),
});

const personalCanon = defineCollection({
  loader: file("data/personal_canon.json5", {
    parser: parseEntries("data/personal_canon.json5"),
  }),
  schema: z.object(sharedFields),
});

// A single object rather than a list, so it becomes a one-entry collection
// keyed "resume".
const resumeEntry = defineCollection({
  loader: file("data/resume.json5", {
    parser: (text) => ({ resume: JSON5.parse(text) }),
  }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    email: z.email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
    experience: z.array(
      z.object({
        org: z.string(),
        period: z.string(),
        roles: z
          .array(
            z.object({
              title: z.string(),
              period: z.string().optional(),
              short_period: z.string().optional(),
            }),
          )
          .optional(),
        bullets: z.array(z.string()),
        stack: z.array(z.string()).optional(),
      }),
    ),
    education: z.array(
      z.object({
        org: z.string(),
        period: z.string(),
        qualification: z.string().optional(),
        bullets: z.array(z.string()),
      }),
    ),
  }),
});

export const collections = {
  "software-canon": softwareCanon,
  "personal-canon": personalCanon,
  resume: resumeEntry,
};
