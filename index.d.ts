interface Entry {
  coordinates: number[];
  id: number;
  ids: number[] | null;
  get interval(): string;
  name: string;
  photographer: string | null;
  source: string;
  story: string;
  get url(): string;
  get urls(): string[];
  distanceTo(coordinates: number[]): number;
  _coordinates(projection?: "EPSG:3857" | "EPSG:4326"): number[];
  _interval(p0: number): string;
}
