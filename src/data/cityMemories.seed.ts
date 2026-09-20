import type { CityMemory } from "../app/types";

// Baltimore City Hall, the anchor point for Artscape 2026.
export const SEED_CITY_MEMORIES: CityMemory[] = [
  {
    id: "artscape-2026",
    title: "Artscape",
    category: "Arts & Culture Festival",
    lat: 39.2908,
    lng: -76.6106,
    eventDate: "May 23–24, 2026",
    summary:
      "The nation's largest free outdoor arts festival, held in downtown Baltimore near City Hall. Features " +
      "interactive visual art, live music, poetry, street dance, an artists' market, and Kidscape programming. " +
      "Organized by the Baltimore Office of Promotion & the Arts; the heart of the festival remains free and " +
      "open to the public.",
    sourceUrl: "https://www.artscape.org/",
    narrative:
      "Step onto a downtown Baltimore street closed to traffic and opened to the public: gallery tents, a " +
      "makers' market, a main stage, and thousands of residents and visitors moving between them on a spring " +
      "weekend. This is a lightweight, factual re-creation of the scene — not a recording of any specific " +
      "performance.",
  },
];
