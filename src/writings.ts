import { getCollection, getEntry, render } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type Writing = {
  slug: string;
  href: `/writings/${string}/`;
  title: string;
  published: string;
  description?: string;
};

const kebabSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function formatPublished(published: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${published}T00:00:00Z`));
}

function toWriting(entry: CollectionEntry<"writings">): Writing {
  const slug = entry.id;
  if (slug === "" || !kebabSlug.test(slug)) {
    throw new Error(
      `writings entry id must be a kebab-case slug, got ${JSON.stringify(slug)}`,
    );
  }
  const writing: Writing = {
    slug,
    href: `/writings/${slug}/`,
    title: entry.data.title,
    published: entry.data.published,
  };
  if (entry.data.description !== undefined) {
    writing.description = entry.data.description;
  }
  return writing;
}

export async function listWritings(): Promise<readonly Writing[]> {
  const entries = await getCollection("writings");
  return entries.map(toWriting).toSorted((a, b) => {
    const byDate = b.published.localeCompare(a.published);
    if (byDate !== 0) return byDate;
    return a.slug.localeCompare(b.slug);
  });
}

export async function loadWriting(slug: string) {
  const entry = await getEntry("writings", slug);
  if (!entry) return undefined;
  const { Content } = await render(entry);
  return { meta: toWriting(entry), Content };
}
