export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
        return jsonResponse({ error: "Missing 'slug' parameter", photos: [] }, 400);
    }

    const profileUrl = `https://www.pornpics.com/pornstars/${slug}/`;

    // Avatar CDN pattern: /models/<first_letter>/<full_name>.jpg
    // e.g. angela-white → /models/a/angela_white.jpg
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
            if (clean && !seen.has(clean)) {
                seen.add(clean);
                photos.push(clean);
            }
        }

        // 1. Model portrait avatar — check if it's referenced in HTML
        if (html.includes(cdnName)) {
            add(avatarUrl);
        }

        // 2. All cdni.pornpics.com URLs extracted from HTML
        //    pornpics uses SINGLE QUOTES: data-src='https://cdni...'
        //    We match both single and double quotes.
        const cdniRegex = /https:\/\/cdni\.pornpics\.com\/[^\s"'<>]+\.jpg/gi;
        let m;
        while ((m = cdniRegex.exec(html)) !== null) {
            add(m[0]);
        }

        // Last resort
        if (photos.length === 0) add(avatarUrl);

        // Extract real name from page <h1> or <title>
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

        return jsonResponse({ name, slug, photos: photos.slice(0, 30) });

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
