import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Timekeeper Countdown",
  description: "Countdown timer library for React and beyond",
  base: "/timekeeper-countdown/",

  head: [
    ["link", { rel: "icon", href: "/timekeeper-countdown/favicon-32x32.png" }],
  ],

  themeConfig: {
    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "API Reference", link: "/api-reference" },
      { text: "Examples", link: "/examples" },
      { text: "React Integration", link: "/react-integration" },
      { text: "FAQ", link: "/faq" },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Core Usage", link: "/core-usage" },
          { text: "React Integration", link: "/react-integration" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "API Reference", link: "/api-reference" },
          { text: "Advanced Usage", link: "/advanced-usage" },
          { text: "Examples", link: "/examples" },
        ],
      },
      {
        text: "More",
        items: [
          { text: "Roadmap", link: "/roadmap" },
          { text: "FAQ", link: "/faq" },
          { text: "Changelog", link: "/changelog" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/eagle-head/timekeeper-countdown",
      },
    ],

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },
  },
});
