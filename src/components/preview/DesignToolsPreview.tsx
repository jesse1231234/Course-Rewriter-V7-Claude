"use client";

import { useMemo } from "react";

interface DesignToolsPreviewProps {
  html: string;
  height?: number;
  className?: string;
}

/**
 * Wrap HTML content with DesignTools CSS for proper preview rendering.
 * Expects designtools.css to be available in the public folder.
 */
function wrapWithDesignToolsCSS(html: string, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${baseUrl}/designtools.css">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #2d3b45;
      background: #fff;
    }
    /* Ensure images don't overflow */
    img {
      max-width: 100%;
      height: auto;
    }
    /* Ensure iframes are responsive */
    iframe {
      max-width: 100%;
    }
  </style>
</head>
<body>${html}</body>
</html>`;
}

/**
 * Preview component that renders HTML content with DesignTools/DesignPLUS CSS styling.
 * The CSS file should be placed at public/designtools.css
 */
export function DesignToolsPreview({
  html,
  height = 600,
  className = "",
}: DesignToolsPreviewProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const srcDoc = useMemo(() => {
    return wrapWithDesignToolsCSS(html, baseUrl);
  }, [html, baseUrl]);

  return (
    <iframe
      srcDoc={srcDoc}
      className={`w-full border-0 bg-white ${className}`}
      style={{ height }}
      sandbox="allow-same-origin"
      title="DesignTools Preview"
    />
  );
}

/**
 * Raw HTML preview without DesignTools CSS (for comparison)
 */
export function RawHtmlPreview({
  html,
  height = 600,
  className = "",
}: DesignToolsPreviewProps) {
  const srcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #2d3b45;
      background: #fff;
    }
    img { max-width: 100%; height: auto; }
    iframe { max-width: 100%; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }, [html]);

  return (
    <iframe
      srcDoc={srcDoc}
      className={`w-full border-0 bg-white ${className}`}
      style={{ height }}
      sandbox="allow-same-origin"
      title="Raw HTML Preview"
    />
  );
}
