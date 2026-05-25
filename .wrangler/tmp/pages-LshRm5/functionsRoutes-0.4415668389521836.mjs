import { onRequest as __api_characters_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\characters.js"
import { onRequest as __api_import_stars_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\import-stars.js"
import { onRequest as __api_proxy_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\proxy.js"
import { onRequest as __api_videos_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\videos.js"

export const routes = [
    {
      routePath: "/api/characters",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_characters_js_onRequest],
    },
  {
      routePath: "/api/import-stars",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_import_stars_js_onRequest],
    },
  {
      routePath: "/api/proxy",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_proxy_js_onRequest],
    },
  {
      routePath: "/api/videos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_videos_js_onRequest],
    },
  ]