/**
 * Starts the API locally. Run: npm run server (or npm run dev:all for API + Vite).
 * On Vercel the same app runs from api/index.js instead.
 */
import app from './app.js'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`)
})
