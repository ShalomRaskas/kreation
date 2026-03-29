import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const PROFILE_PATH = () => path.resolve(process.cwd(), 'src/data/voiceProfile.json')

const localApi = {
  name: 'kreation-local-api',
  configureServer(server) {

    // POST /api/update-profile
    // Reads current voiceProfile.json, dedupes & merges new rules/vocabulary, writes back.
    // Vite HMR picks up the file change automatically — Builder prompts update live.
    server.middlewares.use('/api/update-profile', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
      let body = ''
      req.on('data', c => body += c)
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body)
          const current  = JSON.parse(fs.readFileSync(PROFILE_PATH(), 'utf-8'))
          const updated  = {
            ...current,
            rules:      [...new Set([...current.rules,      ...(incoming.rules      ?? [])])],
            vocabulary: [...new Set([...current.vocabulary, ...(incoming.vocabulary ?? [])])],
          }
          fs.writeFileSync(PROFILE_PATH(), JSON.stringify(updated, null, 2) + '\n')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    })

    // GET /api/random-image?mode=analyze|critique|vibe
    // Uses VITE_UNSPLASH_ACCESS_KEY if set; falls back to Picsum (no key needed).
    // Each mode targets a different visual register to provoke distinct emotional reactions.
    server.middlewares.use('/api/random-image', async (req, res) => {
      if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
      try {
        const mode = new URL(req.url, 'http://localhost').searchParams.get('mode') ?? 'analyze'
        const queries = {
          analyze:  'architecture,technology,infrastructure,detail,design,blueprint',
          critique: 'sports,fashion,advertising,food,politics,art,social',
          vibe:     'landscape,nature,light,atmospheric,abstract,minimal,mood',
        }
        const key = process.env.VITE_UNSPLASH_ACCESS_KEY
        let url, credit

        if (key) {
          const r    = await fetch(`https://api.unsplash.com/photos/random?orientation=landscape&query=${queries[mode] ?? queries.analyze}&client_id=${key}`)
          const data = await r.json()
          url    = data.urls.regular
          credit = { name: data.user.name, link: data.user.links.html }
        } else {
          url    = `https://picsum.photos/1280/720?random=${Date.now()}`
          credit = { name: 'Lorem Picsum', link: 'https://picsum.photos' }
        }

        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ url, credit, mode }))
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    })

    // POST /api/reset-profile
    // Overwrites voiceProfile.json with a blank template.
    server.middlewares.use('/api/reset-profile', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
      try {
        const empty = { tone: '', vocabulary: [], rules: [], pastScripts: [] }
        fs.writeFileSync(PROFILE_PATH(), JSON.stringify(empty, null, 2) + '\n')
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    })

    // GET /api/proxy-image?url=<encoded>
    // Fetches an image server-side (no browser CORS issues) and returns it as base64
    // so the browser can forward it to the Claude Vision API.
    server.middlewares.use('/api/proxy-image', async (req, res) => {
      if (req.method !== 'GET') { res.statusCode = 405; res.end(); return }
      try {
        const imageUrl = decodeURIComponent((req.url.split('?url=')[1] ?? ''))
        if (!imageUrl) { res.statusCode = 400; res.end(); return }
        const r         = await fetch(imageUrl)
        const buffer    = Buffer.from(await r.arrayBuffer())
        const mediaType = r.headers.get('content-type') ?? 'image/jpeg'
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ base64: buffer.toString('base64'), mediaType }))
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    })

  }
}

export default defineConfig({
  plugins: [react(), localApi],
})
