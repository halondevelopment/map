import "ol/ol.css";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import MousePosition from "ol/control/MousePosition";
import { Circle, LineString, Point } from "ol/geom";
import { OSM, Vector as VectorSource } from "ol/source";
import { Fill, Stroke, Style, Text } from "ol/style";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { transform } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { defaults as defaultControls } from "ol/control";
import { compareTwoStrings } from "string-similarity";
import { getLength } from "ol/sphere";

document.addEventListener("DOMContentLoaded", async function () {
  /**
   * @type {Entry[]}
   */
  const entries = await fetch(
    "https://cbsproxy.ibb.gov.tr/?ZamanMakinesiGetir&"
  )
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
        }) =>
          (value = {
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
                (_entry) => _entry.name === entry.name && _entry.id !== entry.id
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

  console.log(entries);

  /**
   * @type {Feature<Circle>[]}
   */
  const circles = entries.map(
      (entry) =>
        new Feature({
          geometry: new Circle(
            transform(entry.coordinates, "EPSG:4326", "EPSG:3857"),
            25
          ),
          hidden: false,
          ...entry,
        })
    ),
    circle_style = new Style({
      renderer(coordinates, state) {
        const [[x, y], [x1, y1]] = coordinates,
          ctx = state.context,
          dx = x1 - x,
          dy = y1 - y,
          radius = Math.sqrt(dx * dx + dy * dy),
          innerRadius = 0,
          outerRadius = radius * 1.4,
          zoom = map.getView().getZoom(),
          radius_multiplier = zoom >= 16 ? 1 : zoom >= 12 ? 9 : 12;

        const gradient = ctx.createRadialGradient(
          x,
          y,
          innerRadius,
          x,
          y,
          outerRadius
        );
        gradient.addColorStop(0, "rgba(255,0,0,0)");
        gradient.addColorStop(0.6, "rgba(255,0,0,0.2)");
        gradient.addColorStop(1, "rgba(255,0,0,0.8)");
        ctx.beginPath();
        ctx.arc(x, y, radius * radius_multiplier, 0, 2 * Math.PI, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.arc(x, y, radius * radius_multiplier, 0, 2 * Math.PI, true);
        ctx.strokeStyle = "rgba(255,0,0,1)";
        ctx.stroke();

        const font_size = zoom >= 16 ? "18" : zoom >= 14 ? "12" : "0";

        ctx.font = `${font_size}px Arial, Helvetica, sans-serif`;
        ctx.fillText(state.feature.get("name"), x + outerRadius * 1.25, y);
      },
    });

  const map = new Map({
    controls: defaultControls({ attribution: false }).extend([
      new MousePosition({
        coordinateFormat: createStringXY(4),
        projection: "EPSG:4326",
      }),
    ]),
    layers: [
      new TileLayer({
        source: new OSM(),
        visible: true,
      }),
      new VectorLayer({
        source: new VectorSource({
          features: [...circles],
        }),
      }),
    ],
    target: "map",
    view: new View({
      center: transform(
        [29.00152421875, 41.013806515957],
        "EPSG:4326",
        "EPSG:3857"
      ),
      zoom: 12,
      minZoom: 9,
      maxZoom: 18,
      extent: [3110000, 4975000, 3340000, 5100000],
    }),
  });

  circles.forEach((circle) => circle.setStyle(circle_style));

  map.on("click", function ({ pixel }) {
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
      console.log(feature, layer);
      if (feature.get("hidden")) return;
      const modal = document.querySelector(".modal"),
        id = feature.get("id"),
        ids = [id, ...(feature.get("ids") ?? [])],
        name = feature.get("name"),
        urls = feature.get("urls");

      modal.style.display = "flex";
      modal.innerHTML = `
      <div class="container">
        <div id="close" class="control" title="Kapat" onclick="this.parentElement.parentElement.style.display = 'none'; this.parentElement.remove();">&times;</div>
        <div class="header" title="${name} (${feature.get("interval")})">${
        name.length >= 18 ? name.slice(0, 18) + "..." : name
      } (${feature.get("_interval")(0)})</div>
        <div class="image">
          <img id="${id}" src="${feature.get("url")}" alt="${feature.get(
        "name"
      )}" title="Açmak için tıkla." onclick="window.open(this.src, '_blank')" hidden>
        <div class="loader"></div>
        </div>
        <div class="story">
          ${feature.get("story")} | ${feature.get("source")}
        </div>
      </div>
        `;

      const image = modal.querySelector(".image");
      function load() {
        image.querySelector(".loader")?.remove();
        this.hidden = false;
        if (ids.length > 0) {
          const index = ids.findIndex((id) => id === +this.id);
          image.innerHTML += `${
            index !== 0
              ? `<div id="previous" class="control" title="Önceki">
                &lt;
              </div>`
              : ""
          }
          ${
            index !== ids.length - 1
              ? `<div id="next" class="control" title="Sonraki">
                &gt;
              </div>`
              : ""
          }`;
        }
      }
      image.firstElementChild.addEventListener("load", load);

      document.addEventListener("click", function ({ path, target }) {
        if (target.classList.contains("control")) {
          const img = image.firstElementChild;
          img.hidden = true;
          image.innerHTML = '<div class="loader"></div>';
          image.appendChild(img);
          const index = ids.findIndex((id) => id === +img.id);
          img.id = index === ids.length - 1 ? ids[0] : ids[index + 1];
          img.addEventListener("load", load);
          img.src = urls[img.id];
        }
      });
    });
  });

  document.querySelector(".slider").addEventListener("input", function (event) {
    const { value } = this;
    let text = document.querySelector(".slider-text");
    text.innerHTML = `Tarih: ${value}`;
    for (const circle of circles)
      if (+value < +circle.get("_interval")(0).split(" -")[0]) {
        circle.setStyle(new Style({ image: "" }));
        circle.set("hidden", true);
      } else if (circle.getStyle().renderer_ === null) {
        circle.setStyle(circle_style);
        circle.set("hidden", false);
      }
  });
});
