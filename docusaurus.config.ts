import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { terminalDark, terminalLight } from "./src/theme/prism-terminal";

// Load .env file for local development (Node.js 20.12+)
try {
  (process as unknown as { loadEnvFile?(p: string): void }).loadEnvFile?.(".env");
} catch {
  // .env not found — env vars may be set in the shell instead
}

// To deploy via GitHub Pages without custom domain, swap to:
// url: "https://mifunedev.github.io"
// baseUrl: "/openharness/"

const config: Config = {
  title: "Open Harness",
  tagline:
    "A portable harness for running coding agents in an isolated Docker sandbox.",
  favicon: "img/favicon.svg",

  url: "https://oh.mifune.dev",
  baseUrl: "/",

  organizationName: "mifunedev",
  projectName: "openharness",

  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
  },

  headTags: [
    ...(process.env.POSTHOG_PROJECT_TOKEN
      ? [
          {
            tagName: "script" as const,
            attributes: {},
            innerHTML: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString()+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init("${process.env.POSTHOG_PROJECT_TOKEN}",{api_host:"${process.env.POSTHOG_HOST || "https://us.i.posthog.com"}",enable_exception_autocapture:true})`,
          },
        ]
      : []),
    {
      tagName: "link",
      attributes: { rel: "preconnect", href: "https://fonts.googleapis.com" },
    },
    {
      tagName: "link",
      attributes: {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "anonymous",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    },
  ],

  themes: [
    "@docusaurus/theme-mermaid",
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        docsDir: "docs",
        blogDir: "blog",
        docsRouteBasePath: "/docs",
        highlightSearchTermsOnTargetPage: true,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
        searchResultLimits: 8,
      },
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        // Redirects for the renamed engine pages: docs/agents/ was renamed
        // to docs/harnesses/. A new "Agents" section now lives at
        // docs/agents/, so /docs/agents and /docs/agents/overview are real
        // pages again and cannot be redirected. The 6 engine-name redirects
        // below preserve old deep-links into the harness pages.
        redirects: [
          { from: "/docs/agents/claude-code", to: "/docs/harnesses/claude-code" },
          { from: "/docs/agents/codex", to: "/docs/harnesses/codex" },
          { from: "/docs/agents/deepagents", to: "/docs/harnesses/deepagents" },
          { from: "/docs/agents/grok-build", to: "/docs/harnesses/grok-build" },
          { from: "/docs/agents/opencode", to: "/docs/harnesses/opencode" },
          { from: "/docs/agents/pi", to: "/docs/harnesses/pi" },
          { from: "/docs/agents/t3code", to: "/docs/harnesses/t3code" },
        ],
      },
    ],
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          path: "docs",
          sidebarPath: "./sidebars.ts",
          editUrl: ({ docPath }) =>
            `https://github.com/mifunedev/openharness-web/edit/main/docs/${docPath}`,
          routeBasePath: "docs",
          showLastUpdateTime: true,
        },
        blog: {
          path: "blog",
          showReadingTime: true,
          blogTitle: "Open Harness Blog",
          blogDescription: "Notes from building Open Harness",
          postsPerPage: 10,
          feedOptions: { type: ["rss", "atom"], title: "Open Harness Blog" },
          editUrl: ({ blogPath }) =>
            `https://github.com/mifunedev/openharness-web/edit/main/blog/${blogPath}`,
          routeBasePath: "blog",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    image: "img/social-card.png",
    metadata: [
      { name: "theme-color", content: "#0b1220" },
      { property: "og:type", content: "website" },
    ],
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
    },
    prism: {
      theme: terminalLight,
      darkTheme: terminalDark,
      additionalLanguages: [
        "bash",
        "json",
        "yaml",
        "docker",
        "diff",
        "tsx",
        "toml",
      ],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      title: "Open Harness",
      hideOnScroll: true,
      logo: {
        alt: "Open Harness Logo",
        src: "img/logo.svg",
        srcDark: "img/logo-dark.svg",
      },
      items: [
        {
          to: "/docs",
          label: "Start Here",
          position: "left",
        },
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        {
          to: "/blog",
          label: "Blog",
          position: "left",
        },
        {
          href: "https://github.com/mifunedev/openharness-web",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs",
            },
          ],
        },
        {
          title: "Project",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/mifunedev/openharness-web",
            },
            {
              label: "License",
              href: "https://github.com/mifunedev/openharness-web/blob/main/LICENSE",
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Open Harness Contributors.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
