/** Turns a wikitext fragment into plain text. */
export function stripWikitext(input) {
  // {{!}} is a pipe that must not end a template argument.
  let s = String(input).replace(/\{\{!\}\}/g, '¦')

  // Templates whose first argument is the text we want.
  s = s.replace(/\{\{\s*(?:Name|Season|Quality)\s*\|([^|}]*)[^}]*\}\}/gi, '$1')
  // Any other template carries nothing we use.
  s = s.replace(/\{\{[^}]*\}\}/g, '')

  s = s.replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '')
  s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
  s = s.replace(/\[\[([^\]]*)\]\]/g, '$1')

  s = s.replace(/'{2,}/g, '')
  s = s.replace(/<br\s*\/?>/gi, ' ')
  s = s.replace(/<[^>]+>/g, '')

  s = s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")

  s = s.replace(/¦/g, '|').replace(/\s+/g, ' ').trim()
  // A trailing footnote star, optionally inside the closing bracket.
  s = s.replace(/\)\*$/, ')').replace(/\*$/, '')
  return s.trim()
}
