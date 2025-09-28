import React from "react";
// ensure classic JSX runtime has React in scope
(globalThis as any).React = React;
import { renderToString } from "react-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "wouter";
import { LanguageProvider } from "../shared/LanguageProvider.js";
import App from "../client/src/App.tsx";

function staticLocationHook(path: string) {
  return () => [path, () => {}] as any;
}

export function render(url: string) {
  const helmetContext: any = {};
  const appElement = React.createElement(
    HelmetProvider,
    { context: helmetContext },
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(
        Router,
        { hook: staticLocationHook(url), children: React.createElement(App, null) }
      )
    )
  );
  const appHtml = renderToString(appElement);
  const { helmet } = helmetContext;
  const headTags = helmet
    ? `${helmet.title.toString()}${helmet.meta.toString()}${helmet.link.toString()}`
    : "";
  return { appHtml, headTags };
}
