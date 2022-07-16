import { createNodeFromHTML } from "./utils";

export default class Modal {
  static Keybinds = Keybinds();

  static Click({ target, ids, urls }, callback) {
    if (target.classList.contains("control") && target.id !== "close") {
      const image = document.querySelector(".modal .image"),
        img = image.querySelector("img");
      img.hidden = true;
      image.innerHTML = '<div class="loader"></div>';
      image.appendChild(img);
      const index = ids.findIndex((id) => id === +img.id);
      if (target.id === "previous") img.id = ids[index - 1];
      else img.id = index === ids.length - 1 ? ids[0] : ids[index + 1];
      typeof callback === "function" && callback(+img.id);
      img.addEventListener("load", function () {
        Modal.Load.bind(this)(ids);
      });
      img.src = urls[img.id];
    }
  }

  static Container({ name, interval, _interval, id, url, story, source }) {
    return `
          <div class="container">
            <div id="close" class="control" title="Kapat" onclick="this.parentElement.parentElement.style.display = 'none'; this.parentElement.remove();">&times;</div>
            <div class="header" title="${name} (${interval})">${
      name.length >= 18 ? name.slice(0, 18) + "..." : name
    } (${_interval(0)})</div>
            <div class="image">
              <img id="${id}" src="${url}" alt="${name}" title="Açmak için tıkla." onclick="window.open(this.src, '_blank')" hidden>
            <div class="loader"></div>
            </div>
            <div class="story">
              ${story} | <i>${source}</i>
            </div>
          </div>
            `;
  }

  static Control(id, title, entity) {
    return `<div id="${id}" class="control" title="${title}">${entity}</div>`;
  }

  static Load(ids = []) {
    const image = document.querySelector(".modal .image");
    if (!image) return;
    this.hidden = false;
    image.querySelector("img").hidden = false;
    image.querySelector(".loader")?.remove();
    if (ids?.length > 0) {
      const index = ids.findIndex((id) => id === +this.id);
      image.innerHTML += `
      ${index !== 0 ? Modal.Control("previous", "Önceki", "&lt;") : ""}
      ${
        index !== ids.length - 1 ? Modal.Control("next", "Sonraki", "&gt;") : ""
      }
      `;
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

  initialize({ ids, urls }, callback) {
    document.addEventListener("click", ({ target }) =>
      Modal.Click({ target, ids, urls }, callback)
    );
    document.addEventListener("keydown", Modal.Keydown.bind(this));

    if (!this.element) {
      const html = '<div class="modal"></div>',
        map = document.getElementById("map");
      if (map) map.before(createNodeFromHTML(html));
      else document.body.innerHTML += html;
    }

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
