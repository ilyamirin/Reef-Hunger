import { defineConfig } from "vite";

const normalizeBase = (value: string): string => {
  if (value === "/") {
    return value;
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const resolveBase = (): string => {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return normalizeBase(explicitBase);
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
    if (repositoryName) {
      return normalizeBase(repositoryName);
    }
  }

  return "/";
};

export default defineConfig({
  base: resolveBase(),
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
