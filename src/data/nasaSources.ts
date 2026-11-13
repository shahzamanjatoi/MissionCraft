export interface NasaDataSource {
  id: string;
  name: string;
  instrument: string;
  description: string;
  dataType: "archived";
  url: string;
}

export const NASA_DATA_SOURCES: NasaDataSource[] = [
  {
    id: "lro-lroc",
    name: "Lunar Reconnaissance Orbiter Camera",
    instrument: "LROC",
    description: "Lunar surface imagery.",
    dataType: "archived",
    url: "https://ode.rsl.wustl.edu/moon/",
  },
  {
    id: "lro-lola",
    name: "Lunar Orbiter Laser Altimeter",
    instrument: "LOLA",
    description: "Lunar surface elevation measurements.",
    dataType: "archived",
    url: "https://ode.rsl.wustl.edu/moon/",
  },
  {
    id: "lro-diviner",
    name: "Diviner Lunar Radiometer",
    instrument: "DIVINER",
    description: "Lunar surface thermal measurements.",
    dataType: "archived",
    url: "https://ode.rsl.wustl.edu/moon/",
  },
];

export const NASA_LUNAR_API =
  "https://oderest.rsl.wustl.edu/live2";

export function getNasaLunarCatalogUrl(): string {
  const params = new URLSearchParams({
    query: "iipt",
    odemetadb: "moon",
    output: "JSON",
  });

  return `${NASA_LUNAR_API}?${params.toString()}`;
}