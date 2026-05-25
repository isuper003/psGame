export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const name = url.searchParams.get("name");

    if (!name) {
        return new Response(JSON.stringify({ error: "Missing 'name' query parameter" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const apiUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(name)}&per_page=15&order=top-rated`;
        
        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: `Eporner API returned status ${response.status}` }), {
                status: 502,
                headers: { "Content-Type": "application/json" }
            });
        }

        const data = await response.json();
        
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            // Pick a random video
            const randomIndex = Math.floor(Math.random() * data.videos.length);
            const video = data.videos[randomIndex];
            
            return new Response(JSON.stringify({
                title: video.title,
                embed_url: video.embed,
                thumbnail: video.default_thumb ? video.default_thumb.src : ""
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "public, max-age=300"
                }
            });
        }

        return new Response(JSON.stringify({ error: "No videos found for this performer" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error: " + err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
