/**
 * The island of Ireland as a closed ring of coastal points, in degrees.
 *
 * Coarse on purpose — this is a background field, not a map. It is a ring of
 * real headlands and bays traced clockwise from Malin Head, so the silhouette
 * reads as Ireland at a glance and does not pretend to be survey data.
 */
export const IRELAND_COAST: [number, number][] = [
  [-7.37, 55.38], // Malin Head
  [-7.05, 55.20], // Lough Foyle
  [-6.70, 55.17], // Portrush
  [-6.15, 55.21], // Torr Head
  [-5.85, 54.98], // Glenarm
  [-5.72, 54.72], // Belfast Lough
  [-5.47, 54.50], // Ards peninsula
  [-5.55, 54.24], // St John's Point
  [-6.08, 54.02], // Carlingford
  [-6.22, 53.86], // Dundalk Bay
  [-6.10, 53.60], // Boyne
  [-6.06, 53.37], // Dublin Bay
  [-6.03, 53.10], // Greystones
  [-6.00, 52.96], // Wicklow Head
  [-6.22, 52.55], // Courtown
  [-6.36, 52.17], // Carnsore Point
  [-6.75, 52.19], // Bannow
  [-6.93, 52.12], // Hook Head
  [-7.30, 52.14], // Tramore
  [-7.62, 52.06], // Dungarvan
  [-8.00, 51.95], // Youghal
  [-8.30, 51.80], // Cork Harbour
  [-8.53, 51.60], // Old Head of Kinsale
  [-9.05, 51.55], // Galley Head
  [-9.45, 51.50], // Baltimore
  [-9.82, 51.45], // Mizen Head
  [-9.90, 51.62], // Sheep's Head
  [-10.10, 51.78], // Beara
  [-10.20, 51.95], // Bolus Head
  [-10.40, 52.00], // Bray Head, Valentia
  [-10.46, 52.11], // Slea Head
  [-10.20, 52.28], // Brandon
  [-9.92, 52.42], // Kerry Head
  [-9.93, 52.57], // Loop Head
  [-9.65, 52.75], // Kilkee
  [-9.48, 52.95], // Cliffs of Moher
  [-9.28, 53.12], // Black Head
  [-9.30, 53.25], // Galway Bay
  [-9.80, 53.33], // Carna
  [-10.23, 53.40], // Slyne Head
  [-10.05, 53.55], // Cleggan
  [-9.85, 53.65], // Killary
  [-9.95, 53.80], // Clew Bay
  [-10.20, 53.97], // Achill Head
  [-10.05, 54.12], // Blacksod
  [-10.00, 54.32], // Erris Head
  [-9.50, 54.28], // Downpatrick Head
  [-9.10, 54.32], // Killala Bay
  [-8.60, 54.32], // Sligo Bay
  [-8.45, 54.48], // Donegal Bay
  [-8.70, 54.63], // Slieve League
  [-8.80, 54.75], // Glencolumbkille
  [-8.50, 54.95], // The Rosses
  [-8.30, 55.15], // Bloody Foreland
  [-8.00, 55.22], // Horn Head
  [-7.68, 55.28], // Fanad Head
]

/** Lough Neagh, the one inland feature big enough to register at this scale */
export const LOUGH_NEAGH: [number, number][] = [
  [-6.44, 54.67], [-6.28, 54.64], [-6.22, 54.52], [-6.28, 54.41],
  [-6.40, 54.38], [-6.50, 54.47], [-6.51, 54.60],
]

const LON0 = -10.6
const LON1 = -5.4
const LAT0 = 51.35
const LAT1 = 55.45

// A degree of longitude is shorter than a degree of latitude, by cos(lat). At
// Ireland's mid-latitude that is about 0.6 — without it the island comes out
// unrecognisably fat.
const SQUEEZE = Math.cos((53.4 * Math.PI) / 180)

const RAW_W = (LON1 - LON0) * SQUEEZE
const RAW_H = LAT1 - LAT0

/** Aspect ratio of the island's bounding box, width over height */
export const IRELAND_ASPECT = RAW_W / RAW_H

/** Degrees to a unit box, y pointing down. Both axes share one scale. */
export function toUnit([lon, lat]: [number, number]): [number, number] {
  return [((lon - LON0) * SQUEEZE) / RAW_W, (LAT1 - lat) / RAW_H]
}
