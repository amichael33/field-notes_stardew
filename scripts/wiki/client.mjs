import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const API = 'https://stardewvalleywiki.com/mediawiki/api.php'

export const USER_AGENT =
  'FieldNotesDataScript/0.1 (personal Stardew planner; one-off data fetch; contact: akm4877@eid.utexas.edu)'

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Fetches wikitext through the MediaWiki API. Every page is saved in cacheDir
 * and read from there on later calls, so the wiki is asked for a page once.
 * Network requests are spaced delayMs apart.
 */
export function createClient({ cacheDir, delayMs = 1000, fetchImpl = fetch, sleep = defaultSleep }) {
  let requestedBefore = false

  const cachePath = (title) => path.join(cacheDir, `${encodeURIComponent(title)}.wikitext`)

  async function getWikitext(title) {
    try {
      return await readFile(cachePath(title), 'utf8')
    } catch {
      // not cached yet
    }

    if (requestedBefore && delayMs > 0) await sleep(delayMs)
    requestedBefore = true

    const url =
      `${API}?action=query&prop=revisions&rvprop=content&rvslots=main` +
      `&format=json&formatversion=2&titles=${encodeURIComponent(title)}`
    const response = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!response.ok) throw new Error(`Wiki request for "${title}" failed with HTTP ${response.status}`)

    const body = await response.json()
    const page = body?.query?.pages?.[0]
    const content = page?.revisions?.[0]?.slots?.main?.content
    if (!page || page.missing || typeof content !== 'string') {
      throw new Error(`Wiki page "${title}" was not found`)
    }

    await mkdir(cacheDir, { recursive: true })
    await writeFile(cachePath(title), content, 'utf8')
    return content
  }

  return { getWikitext }
}
