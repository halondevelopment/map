import "./style.css";
import { LineString } from "ol/geom";
import { transform } from "ol/proj";
import { getLength } from "ol/sphere";
import { compareTwoStrings } from "string-similarity";
import Map from "./map";

export default class TimeMachine {
  constructor(options) {
    this.options = TimeMachine.Options(options);
  }

  static Options(options = {}) {
    if (Array.isArray(options) || typeof options !== "object") options = {};

    if (typeof options.api !== "string" || options.api?.trim() === "")
      throw new Error("API");

    try {
      Map.Options(options.map);
    } catch (error) {
      throw new Error(`MAP_${error.message}`);
    }

    return options;
  }

  async fetchEntries() {
    return await fetch(this.options.api)
      .then((res) => res.json())
      .then((res) =>
        res.map(
          ({
            AD,
            BASLANGICZAMANI,
            BITISZAMANI,
            CEKILENLAT,
            CEKILENLON,
            FOTOGRAFCI,
            HIKAYE,
            KAYNAKCA,
            MAKINEID,
          }) => ({
            coordinates: [
              +CEKILENLON.replace(",", "."),
              +CEKILENLAT.replace(",", "."),
            ],
            id: MAKINEID,
            ids: null,
            get interval() {
              return this._interval();
            },
            name: AD,
            photographer: FOTOGRAFCI,
            similars: null,
            source: KAYNAKCA,
            story: HIKAYE,
            get url() {
              return `http://cbssr.ibb.gov.tr/zamantuneli/images/FOTO_${this.id}.png`;
            },
            get urls() {
              const urls = [];
              urls[this.id] = this.url;
              this.ids?.forEach(
                (id) => (urls[id] = this.url.replace(/([0-9])+/, id))
              );
              return urls;
            },
            _coordinates(projection) {
              switch (projection) {
                case "EPSG:4326":
                  return transform(this.coordinates, "EPSG:3857", "EPSG:4326");

                default:
                  return transform(this.coordinates, "EPSG:4326", "EPSG:3857");
              }
            },
            _interval(p0) {
              switch (p0) {
                case 0:
                  return `${BASLANGICZAMANI.slice(-4)} - ${BITISZAMANI.slice(
                    -4
                  )}`;

                default:
                  return `${BASLANGICZAMANI} - ${BITISZAMANI}`;
              }
            },
            distanceTo(coordinates) {
              return getLength(new LineString([this.coordinates, coordinates]));
            },
          })
        )
      )
      .then(
        (entries) =>
          new Promise(function (resolve) {
            let length = entries.length;
            for (let i = 0; i < length; i++) {
              const entry = entries[i],
                ewsrn = entries.filter(
                  (_entry) =>
                    _entry.id !== entry.id &&
                    compareTwoStrings(_entry.name, entry.name) > 0.5
                );

              if (ewsrn.length > 0) {
                entry.ids = [entry.id];
                entry.similars = [entry];
                for (const _entry of ewsrn) {
                  entry.ids.push(_entry.id);
                  entry.similars.push(_entry);
                  entries.splice(
                    entries.findIndex((__entry) => __entry.id === _entry.id),
                    1
                  );
                  length -= 1;
                }
              }

              if (i === length - 1) resolve(entries);
            }
          })
      );
  }

  async initialize() {
    document.head.innerHTML += `<link rel="preconnect" href="${
      new URL(this.options.api).origin
    }">
    <link rel="prefetch" href="https://visualpharm.com/assets/135/Left-595b40b85ba036ed117dd7af.svg">
    <link rel="prefetch" href="https://visualpharm.com/assets/330/Right-595b40b75ba036ed117d89e8.svg">
    <link rel="prefetch" href="https://visualpharm.com/assets/58/Esc-595b40b75ba036ed117d94f1.svg">`;
    this.entries = await this.fetchEntries();
    this.map = new Map(this.entries, this.options.map).initialize();

    return this;
  }
}
