// Vite supplies the deployment prefix; direct Node tests use the site root.
export const assetPath = (path) =>
  `${import.meta.env?.BASE_URL || "/"}${path.replace(/^\//, "")}`;
