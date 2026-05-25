export async function onRequest(context) {
    const { request } = context;
    
    const PERFORMERS = [
        // Female Stars (Slut category in the game)
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
        
        // Shemale / Trans Stars (Shemale category in the game)
        { name: "Sasha Montenegro", category: "Shemale", labels: ["legend"] },
        { name: "Daisy Taylor", category: "Shemale", labels: ["teen"] },
        { name: "Natalie Mars", category: "Shemale", labels: ["milf", "legend"] },
        { name: "Chanel Santini", category: "Shemale", labels: ["legend"] },
        { name: "Korra Del Rio", category: "Shemale", labels: ["milf"] },

        // Twink Stars (Twink category in the game)
        { name: "Joey Mills", category: "Twink", labels: ["teen", "legend"] },
        { name: "Phoenix Fyre", category: "Twink", labels: ["teen"] },
        { name: "Dante Colle", category: "Twink", labels: ["legend"] },
        { name: "Mickey Taylor", category: "Twink", labels: ["teen"] }
    ];

    try {
        const promises = PERFORMERS.map(async (p) => {
            try {
                const apiUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(p.name)}&per_page=1`;
                const response = await fetch(apiUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/json"
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.videos && data.videos.length > 0) {
                        const video = data.videos[0];
                        const photoUrl = video.default_thumb ? video.default_thumb.src : (video.thumbs && video.thumbs.length > 0 ? video.thumbs[0] : "");
                        if (photoUrl) {
                            return {
                                name: p.name,
                                category: p.category,
                                photoUrl: photoUrl,
                                labels: p.labels
                            };
                        }
                    }
                }
            } catch (err) {
                // Ignore individual fetch errors
            }
            return null;
        });

        const results = await Promise.all(promises);
        const resolvedList = results.filter(item => item !== null);

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
            headers: { "Content-Type": "application/json" }
        });
    }
}
