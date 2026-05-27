export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    if (!env.KV) {
        return new Response(JSON.stringify({ error: "KV namespace binding 'KV' is missing in Pages configuration." }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
        });
    }

    // Handle CORS preflight options
    if (method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }

    try {
        if (method === "GET") {
            const data = await env.KV.get("characters");
            if (!data) {
                // Return empty array if key doesn't exist yet
                return new Response(JSON.stringify([]), {
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
            return new Response(data, {
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        } 
        
        if (method === "POST" || method === "PUT") {
            const characters = await request.json();
            if (!Array.isArray(characters)) {
                return new Response(JSON.stringify({ error: "Data must be a JSON array of characters" }), {
                    status: 400,
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
            await env.KV.put("characters", JSON.stringify(characters));
            return new Response(JSON.stringify({ success: true }), {
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        return new Response("Method Not Allowed", { 
            status: 405,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
