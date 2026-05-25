var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-BIWftL/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// api/browse-stars.js
async function onRequest(context) {
  const url = new URL(context.request.url);
  const category = url.searchParams.get("category") || "female";
  const page = parseInt(url.searchParams.get("page") || "1");
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.pornpics.com/"
  };
  const CATEGORY_URLS = {
    female: /* @__PURE__ */ __name((p) => p === 1 ? "https://www.pornpics.com/pornstars/?sort=popular" : `https://www.pornpics.com/pornstars/?sort=popular&page=${p}`, "female"),
    shemale: /* @__PURE__ */ __name((p) => p === 1 ? "https://www.pornpics.com/pornstars/shemale/?sort=popular" : `https://www.pornpics.com/pornstars/shemale/?sort=popular&page=${p}`, "shemale"),
    gay: /* @__PURE__ */ __name((p) => p === 1 ? "https://www.pornpics.com/pornstars/gay/?sort=popular" : `https://www.pornpics.com/pornstars/gay/?sort=popular&page=${p}`, "gay")
  };
  const getUrl = CATEGORY_URLS[category] || CATEGORY_URLS.female;
  const pageUrl = getUrl(page);
  const SKIP_SLUGS = /* @__PURE__ */ new Set([
    "shemale",
    "gay",
    "lesbian",
    "milf",
    "teen",
    "asian",
    "ebony",
    "latina",
    "amateur",
    "big-tits",
    "blowjob",
    "anal",
    "interracial",
    "mature",
    "bbw",
    "redhead",
    "blonde",
    "brunette",
    "petite",
    "popular",
    "new",
    "all",
    "list",
    "female",
    "male",
    "granny",
    "white",
    "black",
    "indian",
    "tiny-tits",
    "fake-tits",
    "natural-tits",
    "american",
    "argentinian",
    "australian",
    "brazilian",
    "british",
    "canadian",
    "chinese",
    "colombian",
    "cuban",
    "czech",
    "dutch",
    "filipina",
    "french",
    "german",
    "hungarian",
    "italian",
    "japanese",
    "mexican",
    "polish",
    "portuguese",
    "romanian",
    "russian",
    "korean",
    "spanish",
    "swedish",
    "thai",
    "ukrainian",
    "vietnamese",
    "skinny",
    "tall",
    "short",
    "login",
    "register",
    "search",
    "sort",
    "page",
    "tags",
    "categories",
    "pornstars",
    "videos",
    "pics",
    "photos",
    "index"
  ]);
  try {
    const res = await fetch(pageUrl, { headers: HEADERS });
    if (!res.ok) {
      return jsonResponse({ error: `pornpics returned HTTP ${res.status}`, performers: [] }, 502);
    }
    const html = await res.text();
    const performers = [];
    const seenSlugs = /* @__PURE__ */ new Set();
    const allHrefs = [...html.matchAll(/\/pornstars\/([a-z][a-z0-9\-]{1,40}[a-z0-9])\//gi)];
    for (const match2 of allHrefs) {
      const slug = match2[1].toLowerCase();
      if (SKIP_SLUGS.has(slug) || seenSlugs.has(slug)) continue;
      const cdnName = slug.replace(/-/g, "_");
      const firstLetter = cdnName[0];
      const avatarUrl = `https://cdni.pornpics.com/models/${firstLetter}/${cdnName}.jpg`;
      const hrefIdx = html.indexOf(`/pornstars/${slug}/`);
      const nearby = html.slice(hrefIdx, hrefIdx + 400);
      let name = slugToName(slug);
      const spanMatch = nearby.match(/<span[^>]*>([A-Za-z][^<]{1,50})<\/span>/i);
      const altMatch = nearby.match(/alt='([^']{2,60})'/i) || nearby.match(/alt="([^"]{2,60})"/i);
      if (spanMatch) name = spanMatch[1].trim();
      else if (altMatch) name = altMatch[1].trim();
      seenSlugs.add(slug);
      performers.push({ name, slug, avatarUrl });
    }
    const hasMore = html.includes("?sort=popular&page=") || html.includes('rel="next"');
    return jsonResponse({
      performers,
      page,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      category,
      total: performers.length,
      sourceUrl: pageUrl
    });
  } catch (err) {
    return jsonResponse({ error: err.message, performers: [] }, 500);
  }
}
__name(onRequest, "onRequest");
function slugToName(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
__name(slugToName, "slugToName");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
}
__name(jsonResponse, "jsonResponse");

// api/import-stars.js
async function onRequest2(context) {
  const PERFORMERS = [
    // Female Stars (Slut category)
    { name: "Mia Malkova", category: "Slut", labels: ["legend"] },
    { name: "Lana Rhoades", category: "Slut", labels: ["legend"] },
    { name: "Eva Elfie", category: "Slut", labels: ["teen"] },
    { name: "Sweetie Fox", category: "Slut", labels: ["teen"] },
    { name: "Angela White", category: "Slut", labels: ["milf", "legend"] },
    { name: "Gabbie Carter", category: "Slut", labels: ["teen"] },
    { name: "Riley Reid", category: "Slut", labels: ["legend"] },
    { name: "Abella Danger", category: "Slut", labels: ["legend"] },
    { name: "Dani Daniels", category: "Slut", labels: ["milf", "legend"] },
    { name: "Lena Paul", category: "Slut", labels: ["milf"] },
    // Shemale / Trans Stars
    { name: "Sasha Montenegro", category: "Shemale", labels: ["legend"] },
    { name: "Daisy Taylor", category: "Shemale", labels: ["teen"] },
    { name: "Natalie Mars", category: "Shemale", labels: ["milf", "legend"] },
    { name: "Chanel Santini", category: "Shemale", labels: ["legend"] },
    { name: "Korra Del Rio", category: "Shemale", labels: ["milf"] },
    // Twink Stars
    { name: "Joey Mills", category: "Twink", labels: ["teen", "legend"] },
    { name: "Phoenix Fyre", category: "Twink", labels: ["teen"] },
    { name: "Dante Colle", category: "Twink", labels: ["legend"] },
    { name: "Mickey Taylor", category: "Twink", labels: ["teen"] }
  ];
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.pornpics.com/"
  };
  function nameToFormats(name) {
    const lower = name.toLowerCase();
    return {
      cdn: lower.replace(/\s+/g, "_"),
      // CDN avatar: underscore
      slug: lower.replace(/\s+/g, "-")
      // Profile URL: hyphen
    };
  }
  __name(nameToFormats, "nameToFormats");
  async function tryDirectCDN(name) {
    const { cdn } = nameToFormats(name);
    const url = `https://cdni.pornpics.com/models/m/${cdn}.jpg`;
    try {
      const res = await fetch(url, { method: "HEAD", headers: HEADERS });
      if (res.status === 200) {
        return url;
      }
    } catch (e) {
    }
    return null;
  }
  __name(tryDirectCDN, "tryDirectCDN");
  async function tryProfilePage(name) {
    const { slug } = nameToFormats(name);
    const profileUrl = `https://www.pornpics.com/pornstars/${slug}/`;
    try {
      const res = await fetch(profileUrl, { headers: HEADERS });
      if (!res.ok) return null;
      const html = await res.text();
      const avatarMatch = html.match(/https:\/\/cdni\.pornpics\.com\/models\/[^"']+\.jpg/i);
      if (avatarMatch) return avatarMatch[0];
      const galleryMatch = html.match(/https:\/\/cdni\.pornpics\.com\/[0-9]+\/[^"']+\.jpg/i);
      if (galleryMatch) return galleryMatch[0];
    } catch (e) {
    }
    return null;
  }
  __name(tryProfilePage, "tryProfilePage");
  async function trySearchPage(name) {
    const searchUrl = `https://www.pornpics.com/?q=${encodeURIComponent(name)}`;
    try {
      const res = await fetch(searchUrl, { headers: HEADERS });
      if (!res.ok) return null;
      const html = await res.text();
      const match2 = html.match(/https:\/\/cdni\.pornpics\.com\/[0-9]+\/[^"']+\.jpg/i);
      if (match2) return match2[0];
    } catch (e) {
    }
    return null;
  }
  __name(trySearchPage, "trySearchPage");
  async function resolvePerformerImage(performer) {
    const name = performer.name;
    let photoUrl = await tryDirectCDN(name);
    if (photoUrl) {
      return { ...performer, photoUrl, source: "cdn" };
    }
    photoUrl = await tryProfilePage(name);
    if (photoUrl) {
      return { ...performer, photoUrl, source: "profile" };
    }
    photoUrl = await trySearchPage(name);
    if (photoUrl) {
      return { ...performer, photoUrl, source: "search" };
    }
    return null;
  }
  __name(resolvePerformerImage, "resolvePerformerImage");
  try {
    const promises = PERFORMERS.map((p) => resolvePerformerImage(p));
    const results = await Promise.all(promises);
    const resolvedList = results.filter((item) => item !== null).map((item) => ({
      id: `performer-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: item.name,
      category: item.category,
      photoUrl: item.photoUrl,
      labels: item.labels
      // 'source' field removed from final output (was for debugging)
    }));
    return new Response(JSON.stringify(resolvedList), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=600"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
__name(onRequest2, "onRequest");

// api/star-photos.js
async function onRequest3(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return jsonResponse2({ error: "Missing 'slug' parameter", photos: [] }, 400);
  }
  const profileUrl = `https://www.pornpics.com/pornstars/${slug}/`;
  const cdnName = slug.replace(/-/g, "_");
  const firstLetter = cdnName[0];
  const avatarUrl = `https://cdni.pornpics.com/models/${firstLetter}/${cdnName}.jpg`;
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.pornpics.com/pornstars/"
  };
  try {
    let add = function(u) {
      const clean = u.trim();
      if (clean && !seen.has(clean) && clean.endsWith(".jpg")) {
        seen.add(clean);
        photos.push(clean);
      }
    };
    __name(add, "add");
    const res = await fetch(profileUrl, { headers: HEADERS });
    if (!res.ok) {
      return jsonResponse2({ name: slugToName2(slug), slug, photos: [avatarUrl] });
    }
    const html = await res.text();
    const seen = /* @__PURE__ */ new Set();
    const photos = [];
    if (html.includes(cdnName)) {
      add(avatarUrl);
    }
    const cdniRegex = /https:\/\/cdni\.pornpics\.com\/[^\s"'<>\)\]]+\.jpg/gi;
    let m;
    while ((m = cdniRegex.exec(html)) !== null) {
      const rawUrl = m[0];
      if (rawUrl.includes("/460/")) {
        const hdUrl = rawUrl.replace("/460/", "/1280/");
        add(hdUrl);
        add(rawUrl);
      } else {
        add(rawUrl);
      }
    }
    if (photos.length === 0) add(avatarUrl);
    let name = slugToName2(slug);
    const h1Match = html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/i);
    const titleMatch = html.match(/<title>([^|<\-–]{2,60})/i);
    if (h1Match) {
      const n = h1Match[1].trim();
      if (n.length > 1 && !n.includes("<")) name = n;
    } else if (titleMatch) {
      const n = titleMatch[1].trim();
      if (n.length > 1 && n.length < 60) name = n;
    }
    return jsonResponse2({ name, slug, photos: photos.slice(0, 50) });
  } catch (err) {
    return jsonResponse2({ name: slugToName2(slug), slug, photos: [avatarUrl], error: err.message });
  }
}
__name(onRequest3, "onRequest");
function slugToName2(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
__name(slugToName2, "slugToName");
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=600"
    }
  });
}
__name(jsonResponse2, "jsonResponse");

// ../.wrangler/tmp/pages-KjSUqa/functionsRoutes-0.6177890026115765.mjs
var routes = [
  {
    routePath: "/api/browse-stars",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/import-stars",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/star-photos",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  }
];

// C:/Users/7moox/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/7moox/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// C:/Users/7moox/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// C:/Users/7moox/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-BIWftL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// C:/Users/7moox/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-BIWftL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.268208309532301.mjs.map
