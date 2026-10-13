// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtemp, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createClient, USER_AGENT } from './client.mjs'

const apiReply = (title, content) => ({
  ok: true,
  status: 200,
  json: async () => ({ query: { pages: [{ title, revisions: [{ slots: { main: { content } } }] }] } }),
})

describe('wiki client', () => {
  let cacheDir
  beforeEach(async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), 'wiki-cache-'))
  })

  it('fetches wikitext with an identifying user-agent', async () => {
    const fetchImpl = vi.fn(async () => apiReply('Pierre', 'hello'))
    const client = createClient({ cacheDir, delayMs: 0, fetchImpl })
    expect(await client.getWikitext('Pierre')).toBe('hello')
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toContain('stardewvalleywiki.com/mediawiki/api.php')
    expect(url).toContain('titles=Pierre')
    expect(options.headers['User-Agent']).toBe(USER_AGENT)
    expect(USER_AGENT).toMatch(/FieldNotes/)
  })

  it('caches pages on disk so each page is requested once', async () => {
    const fetchImpl = vi.fn(async () => apiReply('Pierre', 'hello'))
    const client = createClient({ cacheDir, delayMs: 0, fetchImpl })
    await client.getWikitext('Pierre')
    await client.getWikitext('Pierre')
    const second = createClient({ cacheDir, delayMs: 0, fetchImpl })
    expect(await second.getWikitext('Pierre')).toBe('hello')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(await readdir(cacheDir)).toHaveLength(1)
  })

  it('waits between network requests but not for cached pages', async () => {
    const sleep = vi.fn(async () => {})
    const fetchImpl = vi.fn(async (url) => apiReply('x', url))
    const client = createClient({ cacheDir, delayMs: 1000, fetchImpl, sleep })
    await client.getWikitext('A')
    await client.getWikitext('B')
    await client.getWikitext('A')
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(1000)
  })

  it('throws a clear error for a missing page', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ query: { pages: [{ title: 'Nope', missing: true }] } }) }))
    const client = createClient({ cacheDir, delayMs: 0, fetchImpl })
    await expect(client.getWikitext('Nope')).rejects.toThrow(/Nope/)
  })

  it('throws on an HTTP error and does not cache it', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }))
    const client = createClient({ cacheDir, delayMs: 0, fetchImpl })
    await expect(client.getWikitext('Pierre')).rejects.toThrow(/503/)
    expect(await readdir(cacheDir)).toHaveLength(0)
  })

  it('stores each page as plain wikitext in the cache', async () => {
    const client = createClient({ cacheDir, delayMs: 0, fetchImpl: async () => apiReply('Pierre', 'body text') })
    await client.getWikitext('Pierre')
    const [file] = await readdir(cacheDir)
    expect(await readFile(path.join(cacheDir, file), 'utf8')).toBe('body text')
  })
})
