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
            const data = await env.KV.get("custom_labels");
            if (!data) {
                // Return default labels if key doesn't exist yet
                const defaults = ['milf', 'teen', 'legend'];
                return new Response(JSON.stringify(defaults), {
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
            const labels = await request.json();
            if (!Array.isArray(labels)) {
                return new Response(JSON.stringify({ error: "Data must be a JSON array of labels" }), {
                    status: 400,
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
            await env.KV.put("custom_labels", JSON.stringify(labels));
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
