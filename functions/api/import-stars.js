export async function onRequest(context) {
    const PERFORMERS = [
        // Female Stars (Slut category)
        { name: "Mia Malkova",    category: "Slut",    labels: ["legend"] },
        { name: "Lana Rhoades",   category: "Slut",    labels: ["legend"] },
        { name: "Eva Elfie",      category: "Slut",    labels: ["teen"] },
        { name: "Sweetie Fox",    category: "Slut",    labels: ["teen"] },
        { name: "Angela White",   category: "Slut",    labels: ["milf", "legend"] },
        { name: "Gabbie Carter",  category: "Slut",    labels: ["teen"] },
        { name: "Riley Reid",     category: "Slut",    labels: ["legend"] },
        { name: "Abella Danger",  category: "Slut",    labels: ["legend"] },
        { name: "Dani Daniels",   category: "Slut",    labels: ["milf", "legend"] },
        { name: "Lena Paul",      category: "Slut",    labels: ["milf"] },

        // Shemale / Trans Stars
        { name: "Sasha Montenegro", category: "Shemale", labels: ["legend"] },
        { name: "Daisy Taylor",     category: "Shemale", labels: ["teen"] },
        { name: "Natalie Mars",     category: "Shemale", labels: ["milf", "legend"] },
        { name: "Chanel Santini",   category: "Shemale", labels: ["legend"] },
        { name: "Korra Del Rio",    category: "Shemale", labels: ["milf"] },

        // Twink Stars
        { name: "Joey Mills",    category: "Twink", labels: ["teen", "legend"] },
        { name: "Phoenix Fyre",  category: "Twink", labels: ["teen"] },
        { name: "Dante Colle",   category: "Twink", labels: ["legend"] },
        { name: "Mickey Taylor", category: "Twink", labels: ["teen"] }
    ];

    // Standard browser-like headers to avoid bot detection
    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.pornpics.com/"
    };

    /**
     * Convert performer name to pornpics CDN/URL formats
     * "Mia Malkova" → { cdn: "mia_malkova", slug: "mia-malkova" }
     */
    function nameToFormats(name) {
        const lower = name.toLowerCase();
        return {
            cdn:  lower.replace(/\s+/g, "_"),   // CDN avatar: underscore
            slug: lower.replace(/\s+/g, "-")    // Profile URL: hyphen
        };
    }

    /**
     * Level 1: Try direct CDN avatar URL
     * Pattern: https://cdni.pornpics.com/models/m/<first_last>.jpg
     */
    async function tryDirectCDN(name) {
        const { cdn } = nameToFormats(name);
        const url = `https://cdni.pornpics.com/models/m/${cdn}.jpg`;
        try {
            const res = await fetch(url, { method: "HEAD", headers: HEADERS });
            if (res.status === 200) {
                return url;
            }
        } catch (e) { /* ignore */ }
        return null;
    }

    /**
     * Level 2: Scrape the performer's profile page
     * Extracts the first cdni.pornpics.com image from the HTML
     */
    async function tryProfilePage(name) {
        const { slug } = nameToFormats(name);
        const profileUrl = `https://www.pornpics.com/pornstars/${slug}/`;
        try {
            const res = await fetch(profileUrl, { headers: HEADERS });
            if (!res.ok) return null;
            const html = await res.text();

            // Try to find the model avatar image first
            // Pattern: <img ... src="https://cdni.pornpics.com/models/..." ...>
            const avatarMatch = html.match(/https:\/\/cdni\.pornpics\.com\/models\/[^"']+\.jpg/i);
            if (avatarMatch) return avatarMatch[0];

            // Fallback: find any gallery image from CDN
            const galleryMatch = html.match(/https:\/\/cdni\.pornpics\.com\/[0-9]+\/[^"']+\.jpg/i);
            if (galleryMatch) return galleryMatch[0];

        } catch (e) { /* ignore */ }
        return null;
    }

    /**
     * Level 3: Search page scrape
     * Searches pornpics for the name and extracts first gallery image
     */
    async function trySearchPage(name) {
        const searchUrl = `https://www.pornpics.com/?q=${encodeURIComponent(name)}`;
        try {
            const res = await fetch(searchUrl, { headers: HEADERS });
            if (!res.ok) return null;
            const html = await res.text();

            // Extract first CDN image from search results
            const match = html.match(/https:\/\/cdni\.pornpics\.com\/[0-9]+\/[^"']+\.jpg/i);
            if (match) return match[0];

        } catch (e) { /* ignore */ }
        return null;
    }

    /**
     * Main resolver: runs all 3 levels in order
     */
    async function resolvePerformerImage(performer) {
        const name = performer.name;

        // Level 1: Direct CDN avatar (fastest, no scraping)
        let photoUrl = await tryDirectCDN(name);
        if (photoUrl) {
            return { ...performer, photoUrl, source: "cdn" };
        }

        // Level 2: Profile page scrape
        photoUrl = await tryProfilePage(name);
        if (photoUrl) {
            return { ...performer, photoUrl, source: "profile" };
        }

        // Level 3: Search page scrape
        photoUrl = await trySearchPage(name);
        if (photoUrl) {
            return { ...performer, photoUrl, source: "search" };
        }

        // All levels failed
        return null;
    }

    try {
        // Run all performers in parallel for speed
        const promises = PERFORMERS.map(p => resolvePerformerImage(p));
        const results = await Promise.all(promises);
        
        const resolvedList = results
            .filter(item => item !== null)
            .map(item => ({
                id: `performer-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
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
