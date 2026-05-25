import { onRequest as __api_import_stars_js_onRequest } from "D:\\Other\\psGame\\functions\\api\\import-stars.js"

export const routes = [
    {
      routePath: "/api/import-stars",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_import_stars_js_onRequest],
    },
  ]