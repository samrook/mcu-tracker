import fs from 'node:fs/promises'
import path from 'node:path'

const SERIES = {
  'aos': {
    title: 'Agents of S.H.I.E.L.D.',
    seasons: { 1: 22, 2: 22, 3: 22, 4: 22, 5: 22, 6: 13, 7: 13 },
  },
  'agent-carter': { title: 'Agent Carter', seasons: { 1: 8, 2: 10 } },
  'daredevil': { title: 'Daredevil', seasons: { 1: 13, 2: 13, 3: 13 } },
  'daredevil-born-again': { title: 'Daredevil: Born Again', seasons: { 1: 9, 2: 8 } },
  'jessica-jones': { title: 'Jessica Jones', seasons: { 1: 13, 2: 13, 3: 13 } },
  'luke-cage': { title: 'Luke Cage', seasons: { 1: 13, 2: 13 } },
  'iron-fist': { title: 'Iron Fist', seasons: { 1: 13, 2: 10 } },
  'defenders': { title: 'The Defenders', seasons: { 1: 8 } },
  'punisher': { title: 'The Punisher', seasons: { 1: 13, 2: 13 } },
  'loki': { title: 'Loki', seasons: { 1: 6, 2: 6 } },
  'wandavision': { title: 'WandaVision', seasons: { 1: 9 } },
  'falcon-winter-soldier': { title: 'The Falcon and the Winter Soldier', seasons: { 1: 6 } },
  'hawkeye': { title: 'Hawkeye', seasons: { 1: 6 } },
  'moon-knight': { title: 'Moon Knight', seasons: { 1: 6 } },
  'echo': { title: 'Echo', seasons: { 1: 5 } },
  'ms-marvel': { title: 'Ms. Marvel', seasons: { 1: 6 } },
  'she-hulk': { title: 'She-Hulk: Attorney at Law', seasons: { 1: 9 } },
  'secret-invasion': { title: 'Secret Invasion', seasons: { 1: 6 } },
  'agatha-all-along': { title: 'Agatha All Along', seasons: { 1: 9 } },
  'ironheart': { title: 'Ironheart', seasons: { 1: 6 } },
  'i-am-groot': { title: 'I Am Groot', seasons: { 1: 5, 2: 5 } },
  'visionquest': { title: 'VisionQuest', seasons: { 1: 8 } },
  'wonder-man': { title: 'Wonder Man', seasons: { 1: 8 } },
}

function pad2(value) {
  return String(value).padStart(2, '0')
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[*'".()]/g, '')
    .replace(/[:/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '-')
}

function normalizeDashes(value) {
  return value.replace(/[–—]/g, '-')
}

function isLikelyUnreleased(text) {
  const t = text.toLowerCase()
  return t.includes('releasing') || t.includes('expected') || t.includes('late ') || t.includes('not sure')
}

function splitBaseTitleAndNote(text) {
  const m = text.match(/^(.*?)\s*\((.*)\)\s*$/)
  if (!m) return { baseTitle: text.trim(), note: null }
  return { baseTitle: m[1].trim(), note: m[2].trim() }
}

function contentIdForMovie(title) {
  return `movie:${slugify(title)}`
}

function contentIdForSpecial(title) {
  return `special:${slugify(title)}`
}

function contentIdForEpisode(seriesKey, season, episode) {
  return `episode:${seriesKey}:s${pad2(season)}e${pad2(episode)}`
}

function buildEpisodeContents(seriesKey, season) {
  const series = SERIES[seriesKey]
  if (!series) throw new Error(`Unknown series key: ${seriesKey}`)
  const count = series.seasons[season]
  if (!count) return []
  const items = []
  for (let ep = 1; ep <= count; ep += 1) {
    const contentId = contentIdForEpisode(seriesKey, season, ep)
    items.push({
      contentId,
      kind: 'episode',
      title: `${series.title} S${season}E${ep}`,
      displayTitle: `${series.title} — S${pad2(season)}E${pad2(ep)}`,
      series: { key: seriesKey, title: series.title, season, episode: ep },
    })
  }
  return items
}

function parseSeasonList(text) {
  const cleaned = normalizeDashes(text)
    .replace(/\s+/g, ' ')
    .replace(/seasons?/i, '')
    .trim()
  const parts = cleaned.split(/,|\band\b|&/i).map((p) => p.trim()).filter(Boolean)
  const seasons = []
  for (const part of parts) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      for (let s = start; s <= end; s += 1) seasons.push(s)
      continue
    }
    const single = part.match(/^(\d+)$/)
    if (single) seasons.push(Number(single[1]))
  }
  return seasons
}

function expandSeriesSeasons({ seriesKey, seasons, sourceText }) {
  const series = SERIES[seriesKey]
  if (!series) return [{ kind: 'unexpanded_series', title: sourceText, displayTitle: sourceText }]
  const results = []
  for (const season of seasons) {
    const count = series.seasons[season]
    if (!count) {
      results.push({
        kind: 'unexpanded_series',
        title: `${series.title} Season ${season}`,
        displayTitle: `${series.title} — Season ${season}`,
      })
      continue
    }
    for (let ep = 1; ep <= count; ep += 1) {
      results.push({
        kind: 'episode',
        seriesKey,
        season,
        episode: ep,
        title: `${series.title} S${season}E${ep}`,
        displayTitle: `${series.title} — S${pad2(season)}E${pad2(ep)}`,
      })
    }
  }
  return results
}

function expandSeriesEpisodeRange({ seriesKey, season, startEp, endEp, sourceText }) {
  const series = SERIES[seriesKey]
  if (!series) return [{ kind: 'unexpanded_series', title: sourceText, displayTitle: sourceText }]

  const count = series.seasons[season]
  const maxEp = count ?? endEp
  const start = Math.max(1, startEp)
  const end = Math.min(endEp, maxEp)

  const results = []
  for (let ep = start; ep <= end; ep += 1) {
    results.push({
      kind: 'episode',
      seriesKey,
      season,
      episode: ep,
      title: `${series.title} S${season}E${ep}`,
      displayTitle: `${series.title} — S${pad2(season)}E${pad2(ep)}`,
    })
  }
  return results
}

function parseLineToItems(sourceText) {
  const text = sourceText.trim()
  const cleaned = normalizeDashes(text).replace(/\s+/g, ' ').trim()

  // Agents of S.H.I.E.L.D. (AoS) shorthands
  if (/^aos\b/i.test(cleaned)) {
    // AoS Season 1, Eps 8-16
    const rangeMatch = cleaned.match(/season\s+(\d+)\s*,\s*ep(?:s)?\s*(\d+)\s*-\s*(\d+)/i)
    if (rangeMatch) {
      return expandSeriesEpisodeRange({
        seriesKey: 'aos',
        season: Number(rangeMatch[1]),
        startEp: Number(rangeMatch[2]),
        endEp: Number(rangeMatch[3]),
        sourceText,
      })
    }

    // AoS Seasons 6 & 7 (or whole season)
    // Important: check this *after* episode ranges, because "AoS Season 1, Eps 1-7"
    // should not be treated as "whole Season 1".
    const seasonsMatch = cleaned.match(/seasons?\s+(.+)$/i)
    if (seasonsMatch && !/ep(?:s)?\b/i.test(seasonsMatch[1])) {
      const seasons = parseSeasonList(seasonsMatch[1])
      return expandSeriesSeasons({ seriesKey: 'aos', seasons, sourceText })
    }
  }

  // Agent Carter (Seasons 1-2)
  {
    const m = cleaned.match(/^agent carter\s*\(seasons?\s+(.+)\)$/i)
    if (m) {
      const seasons = parseSeasonList(m[1])
      return expandSeriesSeasons({ seriesKey: 'agent-carter', seasons, sourceText })
    }
  }

  // Loki Seasons 1 & 2
  {
    const m = cleaned.match(/^loki\s+seasons?\s+(.+)$/i)
    if (m) {
      const seasons = parseSeasonList(m[1])
      return expandSeriesSeasons({ seriesKey: 'loki', seasons, sourceText })
    }
  }

  // Guardians Vol. 1 & 2 -> two movies
  if (/^guardians of the galaxy vol\.?\s*1\s*(?:and|&)\s*2$/i.test(cleaned)) {
    return [
      { kind: 'movie', title: 'Guardians of the Galaxy', displayTitle: 'Guardians of the Galaxy' },
      { kind: 'movie', title: 'Guardians of the Galaxy Vol. 2', displayTitle: 'Guardians of the Galaxy Vol. 2' },
    ]
  }

  // I Am Groot (Shorts) -> expand both seasons
  if (/^i am groot\b/i.test(cleaned)) {
    return expandSeriesSeasons({ seriesKey: 'i-am-groot', seasons: [1, 2], sourceText })
  }

  // Generic "Series: Season N" / "Series Season N" patterns
  {
    const seasonMatch = cleaned.match(/^(.*?)(?::)?\s*season\s+(\d+)$/i)
    if (seasonMatch) {
      const rawSeries = seasonMatch[1].trim()
      const season = Number(seasonMatch[2])

      const seriesKeyByName = {
        'daredevil': 'daredevil',
        'jessica jones': 'jessica-jones',
        'luke cage': 'luke-cage',
        'iron fist': 'iron-fist',
        'the punisher': 'punisher',
        'punisher': 'punisher',
        'daredevil: born again': 'daredevil-born-again',
      }

      const key = seriesKeyByName[rawSeries.toLowerCase()]
      if (key) {
        return expandSeriesSeasons({ seriesKey: key, seasons: [season], sourceText })
      }
    }
  }

  // Standalone known miniseries (expand Season 1)
  {
    const map = new Map([
      ['wandavision', 'wandavision'],
      ['falcon & the winter soldier', 'falcon-winter-soldier'],
      ['the falcon and the winter soldier', 'falcon-winter-soldier'],
      ['hawkeye', 'hawkeye'],
      ['moon knight', 'moon-knight'],
      ['echo', 'echo'],
      ['ms marvel', 'ms-marvel'],
      ['ms. marvel', 'ms-marvel'],
      ['she hulk', 'she-hulk'],
      ['she-hulk', 'she-hulk'],
      ['secret invasion', 'secret-invasion'],
      ['agatha all along', 'agatha-all-along'],
      ['ironheart', 'ironheart'],
      ['the defenders', 'defenders'],
      ['vision quest', 'visionquest'],
      ['visionquest', 'visionquest'],
      ['wonder man', 'wonder-man'],
    ])
    const key = map.get(cleaned.toLowerCase())
    if (key) return expandSeriesSeasons({ seriesKey: key, seasons: [1], sourceText })
  }

  // One-off specials
  if (/holiday special/i.test(cleaned)) {
    const { baseTitle } = splitBaseTitleAndNote(cleaned)
    return [{ kind: 'special', title: baseTitle, displayTitle: baseTitle }]
  }

  // Default: movie-like item (keep as-is)
  const { baseTitle, note } = splitBaseTitleAndNote(cleaned)
  return [{ kind: 'movie', title: baseTitle, displayTitle: baseTitle, unreleased: isLikelyUnreleased(note ?? cleaned) }]
}

function addContent(contents, item) {
  if (item.kind === 'episode') {
    const contentId = contentIdForEpisode(item.seriesKey, item.season, item.episode)
    if (!contents[contentId]) {
      const series = SERIES[item.seriesKey]
      contents[contentId] = {
        contentId,
        kind: 'episode',
        title: item.title,
        displayTitle: item.displayTitle,
        series: { key: item.seriesKey, title: series?.title ?? item.seriesKey, season: item.season, episode: item.episode },
      }
    }
    return contentId
  }

  if (item.kind === 'special') {
    const contentId = contentIdForSpecial(item.title)
    if (!contents[contentId]) {
      contents[contentId] = { contentId, kind: 'special', title: item.title, displayTitle: item.displayTitle }
    }
    return contentId
  }

  if (item.kind === 'unexpanded_series') {
    const contentId = `series:${slugify(item.title)}`
    if (!contents[contentId]) {
      contents[contentId] = { contentId, kind: 'unexpanded_series', title: item.title, displayTitle: item.displayTitle }
    }
    return contentId
  }

  // movie
  const contentId = contentIdForMovie(item.title)
  if (!contents[contentId]) {
    contents[contentId] = {
      contentId,
      kind: 'movie',
      title: item.title,
      displayTitle: item.displayTitle,
      unreleased: Boolean(item.unreleased),
    }
  }
  return contentId
}

async function main() {
  const repoRoot = process.cwd()
  const listPath = path.join(repoRoot, 'list.txt')
  const outPath = path.join(repoRoot, 'web', 'public', 'watchlist.json')

  const raw = await fs.readFile(listPath, 'utf8')
  const lines = raw.split(/\r?\n/)

  const contents = {}
  const timeline = []

  let order = 0
  for (let i = 0; i < lines.length; i += 1) {
    const sourceText = lines[i].trim()
    if (!sourceText) continue

    const items = parseLineToItems(sourceText)
    for (const item of items) {
      const contentId = addContent(contents, item)
      order += 1
      timeline.push({
        entryId: `entry:${order}`,
        contentId,
        order,
        sourceLine: i + 1,
        sourceText,
      })
    }
  }

  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    contents,
    timeline,
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (${timeline.length} timeline entries, ${Object.keys(contents).length} contents)`)
}

await main()
