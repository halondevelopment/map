export default class Modal {
  static Keybinds = Keybinds();
  static Click(target, ids, urls) {
    if (target.classList.contains("control") && target.id !== "close") {
      const image = document.querySelector(".modal .image"),
        img = image.querySelector("img");
      img.hidden = true;
      image.innerHTML = '<div class="loader"></div>';
      image.appendChild(img);
      const index = ids.findIndex((id) => id === +img.id);
      if (target.id === "previous") img.id = ids[index - 1];
      else img.id = index === ids.length - 1 ? ids[0] : ids[index + 1];
      img.addEventListener("load", Modal.Load);
      img.src = urls[img.id];
    }
  }
  static Load() {
    const image = document.querySelector(".modal .image");
    if (!image) return;
    image.querySelector(".loader")?.remove();
    this.hidden = false;
    const ids = this.dataset.ids === "null" ? [] : this.dataset.ids.split(",");
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
  static Keydown({ key }) {
    if (this.element.style.display !== "none") {
      const object = {
        ArrowLeft: "previous",
        ArrowRight: "next",
        Escape: "close",
      };
      object[key] &&
        [...this.element.querySelectorAll(".control")]
          .find((control) => control.id === object[key])
          ?.click();
    }
  }

  get element() {
    return document.querySelector(".modal");
  }

  container(feature) {
    const id = feature.get("id"),
      name = feature.get("name");
    return `
          <div class="container">
            <div id="close" class="control" title="Kapat" onclick="this.parentElement.parentElement.style.display = 'none'; this.parentElement.remove();">&times;</div>
            <div class="header" title="${name} (${feature.get("interval")})">${
      name.length >= 18 ? name.slice(0, 18) + "..." : name
    } (${feature.get("_interval")(0)})</div>
            <div class="image">
              <img data-ids="${feature.get(
                "ids"
              )}" id="${id}" src="${feature.get("url")}" alt="${feature.get(
      "name"
    )}" title="Açmak için tıkla." onclick="window.open(this.src, '_blank')" hidden>
            <div class="loader"></div>
            </div>
            <div class="story">
              ${feature.get("story")} | ${feature.get("source")}
            </div>
          </div>
            `;
  }

  initialize(ids = [], urls = []) {
    document.addEventListener("click", ({ target }) =>
      Modal.Click(target, ids, urls)
    );
    document.addEventListener("keydown", Modal.Keydown.bind(this));

    // FIXME When it cames after #map.map element it breaks the map.
    if (!this.element) document.body.innerHTML += `<div class="modal"></div>`;

    return this;
  }
}

export function Keybinds() {
  return `<div class="keybinds">
      <div data-key="ArrowLeft" data-key="previous" class="binding">
        <img src="https://visualpharm.com/assets/135/Left-595b40b85ba036ed117dd7af.svg" alt="Önceki" class="key">
        <div class="function">Önceki</div>
      </div>
      <div data-key="ArrowRight" data-key="next" class="binding">
        <img src="https://visualpharm.com/assets/330/Right-595b40b75ba036ed117d89e8.svg" alt="Sonraki" class="key">
        <div class="function">Sonraki</div>
      </div>
      <div data-key="Escape" data-target="close" class="binding">
        <img src="https://visualpharm.com/assets/58/Esc-595b40b75ba036ed117d94f1.svg" alt="Kapat" class="key">
        <div class="function">Kapat</div>
      </div>
    </div>`;
}
