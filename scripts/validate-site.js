#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const failures = [];
const results = [];

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function fail(group, message) {
  failures.push(`${group}: ${message}`);
}

function pass(message) {
  results.push(message);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function localTarget(sourceFile, rawUrl) {
  const value = String(rawUrl || "").trim().replace(/^['"]|['"]$/g, "");
  if (!value || /^(?:[a-z]+:)?\/\//i.test(value) || /^(?:data|mailto|tel|javascript):/i.test(value)) return null;
  const [rawPath, fragment = ""] = value.split("#", 2);
  const withoutQuery = rawPath.split("?", 1)[0];
  if (!withoutQuery) return { file:sourceFile, fragment };
  let decoded = withoutQuery;
  try { decoded = decodeURIComponent(withoutQuery); } catch {}
  if (decoded.startsWith("/")) return null;
  return { file:path.resolve(path.dirname(sourceFile), decoded), fragment };
}

function idsIn(html) {
  return [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
}

function validateJavaScript(allFiles) {
  const files = allFiles.filter((file) => file.endsWith(".js"));
  files.forEach((file) => {
    const check = spawnSync(process.execPath, ["--check", file], { encoding:"utf8" });
    if (check.status !== 0) fail("JavaScript", `${relative(file)} has a syntax error: ${(check.stderr || check.stdout).trim()}`);
  });
  pass(`${files.length} JavaScript files passed syntax validation`);
}

function validateHtml(allFiles) {
  const files = allFiles.filter((file) => file.endsWith(".html"));
  const htmlByFile = new Map(files.map((file) => [file, read(file)]));
  const idsByFile = new Map(files.map((file) => [file, new Set(idsIn(htmlByFile.get(file)))]));
  const privatePages = new Set([path.join(root, "review.html"), path.join(root, "status.html")]);
  const dynamicIdsByFile = new Map([
    [path.join(root, "index.html"), new Set(["tab-all"])],
  ]);

  files.forEach((file) => {
    const html = htmlByFile.get(file);
    if (privatePages.has(file) && !/<meta\s+name=["']robots["']\s+content=["'][^"']*\bnoindex\b[^"']*["']\s*\/?>/i.test(html)) {
      fail("Privacy", `${relative(file)} must retain its noindex robots directive`);
    }
    const ids = idsIn(html);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    duplicates.forEach((id) => fail("HTML", `${relative(file)} contains duplicate id "${id}"`));

    for (const match of html.matchAll(/\b(?:for|aria-labelledby|aria-describedby|aria-controls)\s*=\s*["']([^"']+)["']/gi)) {
      match[1].trim().split(/\s+/).forEach((id) => {
        if (id && !idsByFile.get(file).has(id) && !dynamicIdsByFile.get(file)?.has(id)) {
          fail("HTML", `${relative(file)} references missing id "${id}"`);
        }
      });
    }

    for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
      const target = localTarget(file, match[1]);
      if (!target) continue;
      if (!fs.existsSync(target.file) || !fs.statSync(target.file).isFile()) {
        fail("Links", `${relative(file)} points to missing file "${relative(target.file)}"`);
        continue;
      }
      if (target.fragment && target.file.endsWith(".html")) {
        const targetIds = idsByFile.get(target.file) || new Set(idsIn(read(target.file)));
        if (!targetIds.has(target.fragment)) fail("Links", `${relative(file)} points to missing fragment "#${target.fragment}" in ${relative(target.file)}`);
      }
    }

    for (const tab of html.matchAll(/<[^>]+role=["']tab["'][^>]*>/gi)) {
      const controls = tab[0].match(/\baria-controls=["']([^"']+)["']/i)?.[1];
      const tabId = tab[0].match(/\bid=["']([^"']+)["']/i)?.[1];
      if (!controls) continue;
      if (!tabId) { fail("Tabs", `${relative(file)} contains a controlled tab without an id`); continue; }
      const panelPattern = new RegExp(`<[^>]+id=["']${controls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i");
      const panel = html.match(panelPattern)?.[0] || "";
      if (!panel || !new RegExp(`\\baria-labelledby=["']${tabId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(panel)) {
        fail("Tabs", `${relative(file)} tab "${tabId}" does not have a matching labelled panel`);
      }
    }
  });

  pass(`${files.length} HTML pages passed ID, relationship, and internal-link validation`);
}

function validateCss(allFiles) {
  const files = allFiles.filter((file) => file.endsWith(".css"));
  files.forEach((file) => {
    for (const match of read(file).matchAll(/url\(([^)]+)\)/gi)) {
      const target = localTarget(file, match[1]);
      if (target && (!fs.existsSync(target.file) || !fs.statSync(target.file).isFile())) {
        fail("CSS", `${relative(file)} points to missing asset "${relative(target.file)}"`);
      }
    }
  });
  pass(`${files.length} stylesheets passed local-asset validation`);
}

function validateCatalog() {
  const context = vm.createContext({ window:{}, console, encodeURIComponent, decodeURIComponent, URL });
  context.window.window = context.window;
  ["nintendo-classics.js", "hybrid-covers.js", "ps5-covers.js", "games.js", "catalog-utils.js"].forEach((file) => {
    vm.runInContext(read(path.join(root, file)), context, { filename:file });
  });

  const library = context.window.GAME_LIBRARY;
  const catalog = context.window.TOXIC_CATALOG;
  if (!library || !catalog) {
    fail("Catalog", "GAME_LIBRARY or TOXIC_CATALOG did not initialize");
    return;
  }
  const entries = [...catalog.entries];
  if (entries.length !== library.totalGames) fail("Catalog", `catalog has ${entries.length} entries but GAME_LIBRARY reports ${library.totalGames}`);

  const ids = new Set();
  const titles = new Set();
  Object.entries(catalog.systems).forEach(([systemId, system]) => {
    const games = entries
      .filter((game) => game.systemId === systemId)
      .sort((left, right) => Number(left.number) - Number(right.number));
    games.forEach((game, index) => {
      const expectedNumber = String(index + 1).padStart(3, "0");
      const expectedId = `${system.code}#${expectedNumber}`;
      if (game.number !== expectedNumber || game.catalogId !== expectedId) {
        fail("Catalog", `${game.title} is ${game.catalogId}; expected ${expectedId}`);
      }
      if (ids.has(game.catalogId)) fail("Catalog", `duplicate game ID ${game.catalogId}`);
      ids.add(game.catalogId);
      const titleKey = `${systemId}::${String(game.title).toLocaleLowerCase("en")}`;
      if (titles.has(titleKey)) fail("Catalog", `duplicate ${system.label} title "${game.title}"`);
      titles.add(titleKey);

      if (!game.image && !game.appId) fail("Artwork", `${game.catalogId} ${game.title} has no artwork source`);
      if (typeof game.image === "string") {
        const sprite = game.image.match(/^hybrid-sprite:(.+):\d+$/);
        const artwork = sprite ? sprite[1] : game.image;
        if (!/^(?:[a-z]+:)?\/\//i.test(artwork) && !artwork.startsWith("data:")) {
          const artworkFile = path.resolve(root, artwork);
          if (!fs.existsSync(artworkFile) || !fs.statSync(artworkFile).isFile()) {
            fail("Artwork", `${game.catalogId} ${game.title} points to missing file "${artwork}"`);
          }
        }
      }
    });
  });
  pass(`${entries.length} games passed ID, numbering, duplicate-title, and artwork validation`);
}

function validateSecrets(allFiles) {
  const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".sql", ".ts", ".txt", ".yaml", ".yml"]);
  const webhookPattern = new RegExp(["https?:\\/\\/", "(?:canary\\.)?discord(?:app)?\\.com", "\\/api\\/webhooks\\/", "[0-9]+\\/", "[A-Za-z0-9._-]+"].join(""), "i");
  allFiles.filter((file) => textExtensions.has(path.extname(file))).forEach((file) => {
    if (webhookPattern.test(read(file))) fail("Secrets", `${relative(file)} appears to contain a Discord webhook URL`);
  });
  pass("No Discord webhook URLs were found in publishable source files");
}

const allFiles = walk(root);
validateJavaScript(allFiles);
validateHtml(allFiles);
validateCss(allFiles);
validateCatalog();
validateSecrets(allFiles);

if (failures.length) {
  console.error("\nWebsite validation failed:\n");
  failures.forEach((message) => console.error(`  - ${message}`));
  console.error(`\n${failures.length} problem${failures.length === 1 ? "" : "s"} must be fixed before publishing.\n`);
  process.exit(1);
}

console.log("\nWebsite validation passed:\n");
results.forEach((message) => console.log(`  ✓ ${message}`));
console.log("\nThe site is ready to publish.\n");
