import "ol/ol.css";
import { transform } from "ol/proj";
import TimeMachine from "./lib/machine";

document.addEventListener("DOMContentLoaded", async function () {
  const time_machine = await new TimeMachine({
    api: "https://cbsproxy.ibb.gov.tr/?ZamanMakinesiGetir&",
    map: {
      center: transform(
        //[29.00152421875, 41.013806515957],
        [28.96487363, 41.00934947],
        "EPSG:4326",
        "EPSG:3857"
      ),
      extent: [3110000, 4975000, 3340000, 5100000],
      zoom: {
        maxZoom: 18,
        minZoom: 9,
        zoom: 16,
      },
    },
  }).initialize();
});
