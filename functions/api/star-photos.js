export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return jsonResponse({ error: "Missing 'slug' parameter", photos: [] }, 400);
    }

    const profileUrl = `https://www.pornpics.com/pornstars/${slug}/`;

    // Avatar CDN: /models/<first_letter>/<slug_underscored>.jpg
    const cdnName     = slug.replace(/-/g, '_');
    const firstLetter = cdnName[0];
    const avatarUrl   = `https://cdni.pornpics.com/models/${firstLetter}/${cdnName}.jpg`;

    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.pornpics.com/pornstars/"
    };

    try {
        const res = await fetch(profileUrl, { headers: HEADERS });

        if (!res.ok) {
            return jsonResponse({ name: slugToName(slug), slug, photos: [avatarUrl] });
        }

        const html = await res.text();
        const seen  = new Set();
        const photos = [];

        function add(u) {
            const clean = u.trim();
            if (clean && !seen.has(clean) && clean.endsWith('.jpg')) {
                seen.add(clean);
                photos.push(clean);
            }
        }

        // 1. Model portrait avatar (always first)
        if (html.includes(cdnName)) {
            add(avatarUrl);
        }

        // 2. Extract ALL cdni.pornpics.com URLs from the HTML
        //    pornpics uses SINGLE QUOTES: data-src='...'
        //    So we scan for raw URLs, not attribute patterns
        const cdniRegex = /https:\/\/cdni\.pornpics\.com\/[^\s"'<>\)\]]+\.jpg/gi;
        let m;
        while ((m = cdniRegex.exec(html)) !== null) {
            const rawUrl = m[0];

            /**
             * Quality upgrade strategy:
             * pornpics CDN uses /460/ for profile thumbnails.
             * Try to get /1280/ (full HD) first — the app will fallback to /460/ if 1280 fails.
             * URL pattern: cdni.pornpics.com/{size}/{partition}/{id1}/{id2}/{id2}_{seq}_{hash}.jpg
             */
            if (rawUrl.includes('/460/')) {
                // Add HD version first (the app will try this first)
                const hdUrl = rawUrl.replace('/460/', '/1280/');
                add(hdUrl);
                // Also add the original 460 as a fallback reference
                // (SmartAdder.showCurrentPhoto handles fallback via onerror)
                add(rawUrl);
            } else {
                add(rawUrl);
            }
        }

        // Last resort: at least show the avatar
        if (photos.length === 0) add(avatarUrl);

        // Extract real performer name from <h1> or <title>
        let name = slugToName(slug);
        const h1Match    = html.match(/<h1[^>]*>([^<]{2,60})<\/h1>/i);
        const titleMatch = html.match(/<title>([^|<\-–]{2,60})/i);
        if (h1Match) {
            const n = h1Match[1].trim();
            if (n.length > 1 && !n.includes('<')) name = n;
        } else if (titleMatch) {
            const n = titleMatch[1].trim();
            if (n.length > 1 && n.length < 60) name = n;
        }

        return jsonResponse({ name, slug, photos: photos.slice(0, 50) });

    } catch (err) {
        return jsonResponse({ name: slugToName(slug), slug, photos: [avatarUrl], error: err.message });
    }
}

function slugToName(slug) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=600"
        }
    });
}
