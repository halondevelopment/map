import { Feature, MapBrowserEvent } from "ol";
import Style from "ol/style/Style";

export function Keybinds(): string;

export class Modal {
  static Keybinds: string;
  static Click(target: EventTarget, ids: number[], urls: string[]): void;
  static Load(): void;
  static Keydown({ key }: { key: string }): void;

  get element(): Element;

  container(feature: Feature): string;
  initialize(ids: number[], urls: string[]): this;
}

export interface Entry {
  coordinates: number[];
  id: number;
  ids: number[] | null;
  get interval(): string;
  name: string;
  photographer: string | null;
  similars: Entry[] | null;
  source: string;
  story: string;
  get url(): string;
  get urls(): string[];
  distanceTo(coordinates: number[]): number;
  _coordinates(projection?: "EPSG:3857" | "EPSG:4326"): number[];
  _interval(p0: number): string;
}

export class Slider {
  static Input(): void;
  get element(): Element;
}

export interface MapOptions {
  center: number[];
  extent: number[];
  zoom: {
    maxZoom: number;
    minZoom: number;
    zoom: number;
  };
}

export class Map {
  constructor(entries: Entry[], options: MapOptions);
  circle_style: Style;
  options: MapOptions;
  slider: Slider;

  static Options(options: Partial<MapOptions>): MapOptions;
  static MapOnClick(event: MapBrowserEvent<any>): void;

  initialize(): this;
}

export interface TimeMachineOptions {
  api: string;
  map: MapOptions;
}

export = class TimeMachine {
  constructor(options: TimeMachineOptions);
  entries: Entry[];
  map: Map;
  options: TimeMachineOptions;

  static Options(options: Partial<TimeMachineOptions>): TimeMachineOptions;

  fetchEntries(): Promise<Entry[]>;
  initialize(): Promise<this>;
};
