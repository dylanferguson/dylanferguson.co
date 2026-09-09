/* Evaluated once per build process. The layout frontmatter re-runs for every
   page, so a `new Date()` there would stamp each page a different instant. */
export const BUILD_TIME = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
