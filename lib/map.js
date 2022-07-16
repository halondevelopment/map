import "ol/ol.css";
import { Feature, Map as _Map, View } from "ol";
import { Circle } from "ol/geom";
import { OSM, Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { transform } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { defaults as defaultControls, MousePosition, ZoomSlider } from "ol/control";
import Modal from "./modal";
import Style from "ol/style/Style";
import Slider from "./slider";

export default class Map {
  constructor(entries, options) {
    this.options = Map.Options(options);
    this.circles = entries.map(
      (entry) =>
        new Feature({
          geometry: new Circle(
            transform(entry.coordinates, "EPSG:4326", "EPSG:3857"),
            25
          ),
          hidden: false,
          ...entry,
        })
    );
    //this.slider = new Slider(this.circles);

    if (!this.element)
      document.body.innerHTML += `<div id="map" class="map"></div>`;

    const map_resize = () =>
      (this.element.style = `width: ${window.innerWidth}px; height: ${window.innerHeight}px;`);
    map_resize();
    window.addEventListener("resize", map_resize);
  }

  static Options(options = {}) {
    if (Array.isArray(options) || typeof options !== "object") options = {};
    const arrayCheck = (array) =>
      !Array.isArray(array) ||
      !array.every((value) => typeof value === "number");

    if (arrayCheck(options.center)) throw new Error("CENTER");

    if (arrayCheck(options.extent)) throw new Error("EXTENT");

    if (
      !Object.values(options.zoom).every((value) => typeof value === "number")
    )
      throw new Error("ZOOM");

    return options;
  }

  static OnClick({ pixel }) {
    this.forEachFeatureAtPixel(pixel, function (feature, layer) {
      if (feature.get("hidden")) return;
      const ids = feature.get("ids"),
        similars = feature.get("similars"),
        urls = feature.get("urls"),
        modal = new Modal().initialize({ ids, urls }, callback);

      const element = modal.element;

      element.style.display = "flex";
      element.innerHTML =
        Modal.Container({
          ...feature.getProperties(),
        }) + Modal.Keybinds;

      element
        .querySelector(".image")
        .firstElementChild.addEventListener("load", function () {
          Modal.Load.bind(this)(ids);
        });

      function callback(id) {
        const element = modal.element;

        element.innerHTML =
          Modal.Container({
            ...similars.find((similar) => similar.id === id),
          }) + Modal.Keybinds;

        element
          .querySelector(".image")
          .firstElementChild.addEventListener("load", function () {
            Modal.Load.bind(this)(ids);
          });
      }
    });
  }

  get element() {
    return document.querySelector("#map");
  }

  initialize() {
    const map = new _Map({
      controls: defaultControls({ attribution: false }).extend([
        new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: "EPSG:4326",
        }),
        new ZoomSlider()
      ]),
      layers: [
        new TileLayer({
          source: new OSM(),
          visible: true,
        }),
        new VectorLayer({
          source: new VectorSource({
            features: [...this.circles],
          }),
        }),
      ],
      target: "map",
      view: new View({
        center: this.options.center,
        extent: this.options.extent,
        ...this.options.zoom,
      }),
    });

    this.circle_style = new Style({
      renderer(coordinates, state) {
        const [[x, y], [x1, y1]] = coordinates,
          ctx = state.context,
          dx = x1 - x,
          dy = y1 - y,
          radius = Math.sqrt(dx * dx + dy * dy),
          view = map.getView(),
          max_zoom = view.getMaxZoom(),
          min_zoom = view.getMinZoom(),
          resolution = view.getResolution(),
          zoom = view.getZoom(),
          multiplier =
            resolution >= max_zoom ? max_zoom / 2.5 : resolution / 2.5,
          innerRadius = 0,
          outerRadius = radius * 1.5;

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
        ctx.arc(x, y, radius * multiplier, 0, 2 * Math.PI, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.arc(x, y, radius * multiplier, 0, 2 * Math.PI, true);
        ctx.strokeStyle = "rgba(255,0,0,1)";
        ctx.stroke();

        ctx.font = `${
          zoom <= min_zoom + (max_zoom / 4) ? 0 : zoom
        }px Arial, Helvetica, sans-serif`;
        ctx.fillText(
          state.feature.get("name"),
          x + outerRadius * multiplier,
          y
        );
      },
    });

    for (const circle of this.circles) circle.setStyle(this.circle_style);

    map.on("click", Map.OnClick);

    this.map = map;

    return this;
  }
}
