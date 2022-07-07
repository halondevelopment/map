import "ol/ol.css";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import MousePosition from "ol/control/MousePosition";
import { Circle } from "ol/geom";
import { OSM, Vector as VectorSource } from "ol/source";
import { Style } from "ol/style";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { transform } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { defaults as defaultControls } from "ol/control";

document.addEventListener("DOMContentLoaded", async function () {
  /**
   * @type {{ AD: string, BASLANGICZAMANI: string, BITISZAMANI: string, CEKILENLAT: string, CEKILENLON: string, FOTOGRAFCI: string | null, HIKAYE: string, KAYNAKCA: string, MAKINEID: number }[]}
   */
  const data = await fetch(
    "https://cbsproxy.ibb.gov.tr/?ZamanMakinesiGetir&"
  ).then((res) => res.json());
  //data.length = 100;

  /**
   * @type {Feature<Circle>[]}
   */
  const circles = [],
    circle_style = new Style({
      renderer(coordinates, state) {
        const [[x, y], [x1, y1]] = coordinates;
        const ctx = state.context;
        const dx = x1 - x;
        const dy = y1 - y;
        const radius = Math.sqrt(dx * dx + dy * dy);

        const innerRadius = 0;
        const outerRadius = radius * 1.4;

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
        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.arc(x, y, radius, 0, 2 * Math.PI, true);
        ctx.strokeStyle = "rgba(255,0,0,1)";
        ctx.stroke();
      },
    });

  for (let {
    AD,
    BASLANGICZAMANI,
    BITISZAMANI,
    CEKILENLAT,
    CEKILENLON,
    HIKAYE,
    KAYNAKCA,
    MAKINEID,
  } of data) {
    const circle = new Feature({
      geometry: new Circle(
        transform(
          [+CEKILENLON.replace(",", "."), +CEKILENLAT.replace(",", ".")],
          "EPSG:4326",
          "EPSG:3857"
        ),
        25
      ),
      hidden: false,
      id: MAKINEID,
      interval: `${BASLANGICZAMANI.slice(-4)} - ${BITISZAMANI.slice(-4)}`,
      name: AD,
      source: KAYNAKCA,
      story: HIKAYE,
    });
    circle.setStyle(circle_style);
    circles.push(circle);
  }

  const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(4),
    projection: "EPSG:4326",
  });

  const map = new Map({
    controls: defaultControls({ attribution: false }).extend([
      mousePositionControl,
      //new ZoomSlider(),
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
      minZoom: 10,
      maxZoom: 20,
      extent: [3110000, 4975000, 3340000, 5100000],
    }),
  });

  map.on("click", function ({ pixel }) {
    map.forEachFeatureAtPixel(pixel, function (feature, layer) {
      console.log(feature, layer);
      if (feature.get("hidden")) return;
      const modal = document.querySelector(".modal"),
        header = feature.get("name");
      modal.style.display = "flex";

      modal.innerHTML = `<div class="container"><div class="close" title="Kapat" onclick="this.parentElement.parentElement.style.display = 'none'">&times;</div>
      <div class="header" title="${header}">${
        header.length >= 18 ? header.slice(0, 18) + "..." : header
      } (${feature.get("interval")})</div>
        <div class="image">
          <img src="http://cbssr.ibb.gov.tr/zamantuneli/images/FOTO_${feature.get(
            "id"
          )}.png" alt="${feature.get(
        "name"
      )}" title="Açmak için tıkla." onclick="window.open(this.src, '_blank')">
        </div>
        <div class="description">
          ${feature.get("source")}
        </div>
        </div>
        `;
    });
  });

  document.querySelector(".slider").addEventListener("input", function (event) {
    const { value } = this;
    let text = document.querySelector(".slider-text");
    text.innerHTML = "Tarih: " + value;
    for (const circle of circles)
      if (+value < +circle.get("interval").split(" -")[0]) {
        circle.setStyle(new Style({ image: "" }));
        circle.set("hidden", true);
      } else if (circle.getStyle().renderer_ === null)
        circle.setStyle(circle_style);
  });
});
