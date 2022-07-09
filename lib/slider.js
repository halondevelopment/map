export default class Slider {
  constructor(circles) {
    if (!this.element) {
      const html = `<div class="slidercontainer">
      <p class="slider-text">Tarih: 1995</p>
      <input class="slider" type="range" min="1850" max="1995" value="1995" />
      </div>`,
        map = document.getElementById("map");
      if (map) map.before(createNodeFromHTML(html));
      else document.body.innerHTML += html;
    }

    const element = this.element;
    element.addEventListener("input", Slider.Input.bind(element, circles));
  }

  static Input(circles) {
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
  }

  get element() {
    return document.querySelector(".slider");
  }
}
