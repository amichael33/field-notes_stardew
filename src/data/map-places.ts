/**
 * Where each schedule place sits on the Stardew map, in pixels of the game's 300 x 180 valley map
 * (taken from the centres of the areas in the game's Data/WorldMap.json).
 */
export const MAP_SIZE = { w: 300, h: 180 }

export const PLACE_POSITIONS: Record<string, { x: number; y: number }> = {
  "Alex's house": { x: 190, y: 89 },
  'Cindersap Forest': { x: 85, y: 128 },
  "Clint's Blacksmith": { x: 215, y: 104 },
  "Elliott's cabin": { x: 212, y: 141 },
  "Haley and Emily's house": { x: 165, y: 108 },
  "Haley and Emily's sunroom": { x: 165, y: 108 },
  "Harvey's Clinic": { x: 172, y: 85 },
  "Harvey's apartment": { x: 172, y: 85 },
  "Jodi's house": { x: 154, y: 106 },
  JojaMart: { x: 218, y: 81 },
  "Leah's cottage": { x: 113, y: 114 },
  "Linus's tent": { x: 187, y: 28 },
  "Marnie's Ranch": { x: 105, y: 103 },
  'Pelican Town': { x: 169, y: 96 },
  "Penny and Pam's trailer": { x: 200, y: 95 },
  "Pierre's General Store": { x: 178, y: 83 },
  "Robin's house": { x: 175, y: 35 },
  "Sebastian's room": { x: 175, y: 35 },
  'The Bathhouse': { x: 150, y: 19 },
  'The Beach': { x: 215, y: 155 },
  'The Community Center': { x: 186, y: 57 },
  "The Mayor's manor": { x: 192, y: 105 },
  'The Mountain': { x: 214, y: 35 },
  'The Museum': { x: 222, y: 110 },
  'The Oasis': { x: 36, y: 22 },
  'The Railroad': { x: 171, y: 15 },
  'The Stardrop Saloon': { x: 179, y: 95 },
  'The bus stop': { x: 130, y: 65 },
  "Willy's Fish Shop": { x: 204, y: 155 },
}
