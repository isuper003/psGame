export async function onRequest(context) {
    const url = new URL(context.request.url);
    const category = url.searchParams.get('category') || 'female';
    const page = parseInt(url.searchParams.get('page') || '1');

    const HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.pornpics.com/"
    };

    /**
     * pornpics.com /pornstars/ page is a filter page, NOT a performer list.
     * The actual performer lists are on alphabetical pages:
     *   /pornstars/a/ /pornstars/b/ ... /pornstars/z/
     * Or via category search:
     *   /pornstars/?sort=popular (female)
     *   /pornstars/shemale/?sort=popular
     *   /pornstars/gay/?sort=popular
     */
    const CATEGORY_URLS = {
        female:  (p) => p === 1 ? 'https://www.pornpics.com/pornstars/?sort=popular' : `https://www.pornpics.com/pornstars/${p}/?sort=popular`,
        shemale: (p) => p === 1 ? 'https://www.pornpics.com/pornstars/shemale/?sort=popular' : `https://www.pornpics.com/pornstars/shemale/${p}/?sort=popular`,
        gay:     (p) => p === 1 ? 'https://www.pornpics.com/pornstars/gay/?sort=popular' : `https://www.pornpics.com/pornstars/gay/${p}/?sort=popular`
    };

    const getUrl = CATEGORY_URLS[category] || CATEGORY_URLS.female;
    const pageUrl = getUrl(page);

    // Slugs that are navigation/filter tags, not performer names
    const SKIP_SLUGS = new Set([
        'shemale','gay','lesbian','milf','teen','asian','ebony','latina',
        'amateur','big-tits','blowjob','anal','interracial','mature','bbw',
        'redhead','blonde','brunette','petite','popular','new','all','list',
        'female','male','granny','white','black','indian','tiny-tits','fake-tits',
        'natural-tits','american','argentinian','australian','brazilian','british',
        'canadian','chinese','colombian','cuban','czech','dutch','filipina','french',
        'german','hungarian','italian','japanese','mexican','polish','portuguese',
        'romanian','russian','korean','spanish','swedish','thai','ukrainian',
        'vietnamese','skinny','tall','short','login','register','search','sort',
        'page','tags','categories','pornstars','videos','pics','photos','index'
    ]);


    try {
        const res = await fetch(pageUrl, { headers: HEADERS });
        if (!res.ok) {
            return jsonResponse({ error: `pornpics returned HTTP ${res.status}`, performers: [] }, 502);
        }

        const html = await res.text();
        const performers = [];
        const seenSlugs = new Set();

        // Extract all unique /pornstars/<slug>/ hrefs from the page
        // Use raw URL scan rather than attribute matching to handle both quote styles
        const allHrefs = [...html.matchAll(/\/pornstars\/([a-z][a-z0-9\-]{1,40}[a-z0-9])\//gi)];

        for (const match of allHrefs) {
            const slug = match[1].toLowerCase();
            if (SKIP_SLUGS.has(slug) || seenSlugs.has(slug)) continue;

            // Build avatar CDN URL:  /models/<first_letter>/<slug_underscored>.jpg
            const cdnName = slug.replace(/-/g, '_');
            const firstLetter = cdnName[0];
            const avatarUrl = `https://cdni.pornpics.com/models/${firstLetter}/${cdnName}.jpg`;

            // Try to find performer name near the slug in HTML
            // Look for the href context and find span or alt text nearby
            const hrefIdx = html.indexOf(`/pornstars/${slug}/`);
            const nearby = html.slice(hrefIdx, hrefIdx + 400);
            let name = slugToName(slug);

            // Try span text near the link
            const spanMatch = nearby.match(/<span[^>]*>([A-Za-z][^<]{1,50})<\/span>/i);
            const altMatch  = nearby.match(/alt='([^']{2,60})'/i) || nearby.match(/alt="([^"]{2,60})"/i);
            if (spanMatch) name = spanMatch[1].trim();
            else if (altMatch) name = altMatch[1].trim();

            seenSlugs.add(slug);
            performers.push({ name: cleanPerformerName(name), slug, avatarUrl });
        }

        // Assume more pages exist if we got performers from this page.
        // Only mark hasMore=false when zero performers came back (we've hit the end).
        // The old approach of string-matching 'rel=next' or 'page=N' was unreliable
        // because pornpics.com uses varied HTML structures across pages.
        const hasMore = performers.length > 0;

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

function cleanPerformerName(name) {
    if (!name) return '';
    return name
        .replace(/\b(?:nude|pics|photos|videos|pic|photo|video|bio|profile|pornstar|porn\s+star)\b/gi, '')
        .replace(/&/g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, ' ')
        .trim();
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
            "Cache-Control": "public, max-age=300"
        }
    });
}
