import { LineString } from "ol/geom";
import { transform } from "ol/proj";
import { getLength } from "ol/sphere";
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
    return await fetch("https://cbsproxy.ibb.gov.tr/?ZamanMakinesiGetir&")
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
        /**
         *
         * @param {Entry[]} entries
         * @returns
         */
        function (entries) {
          return new Promise(function (resolve) {
            entries.length = 100;
            let length = entries.length;
            for (let i = 0; i < length; i++) {
              const entry = entries[i],
                ewsn = entries.filter(
                  (_entry) =>
                    _entry.name === entry.name && _entry.id !== entry.id
                );

              if (ewsn.length > 0) {
                entry.ids = [];
                for (const _entry of ewsn) {
                  entry.ids.push(_entry.id);
                  entries.splice(
                    entries.findIndex((__entry) => __entry.id === _entry.id),
                    1
                  );
                  length -= 1;
                }
              }

              if (i === length - 1) resolve(entries);
            }
          });
        }
      );
  }

  async initialize() {
    this.entries = await this.fetchEntries();
    this.map = new Map(this.entries, this.options.map).initialize();

    if (!document.querySelector(".slidercontainer"))
      document.body.innerHTML += `<div class="slidercontainer">
      <p class="slider-text">Tarih: 1995</p>
      <input class="slider" type="range" min="1850" max="1995" value="1995" />
    </div>`;

    return this;
  }
}