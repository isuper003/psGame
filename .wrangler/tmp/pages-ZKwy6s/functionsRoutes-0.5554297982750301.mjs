import { onRequest as __api_browse_stars_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\browse-stars.js"
import { onRequest as __api_characters_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\characters.js"
import { onRequest as __api_import_stars_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\import-stars.js"
import { onRequest as __api_labels_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\labels.js"
import { onRequest as __api_star_photos_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\star-photos.js"

export const routes = [
    {
      routePath: "/api/browse-stars",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_browse_stars_js_onRequest],
    },
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
      routePath: "/api/labels",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_labels_js_onRequest],
    },
  {
      routePath: "/api/star-photos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_star_photos_js_onRequest],
    },
  ]