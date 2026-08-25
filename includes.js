const sidebar = document.querySelector("#sidebar-placeholder");
const includeScript = document.currentScript;

fetch(new URL("sidebar.html", includeScript.src))
  .then((response) => response.text())
  .then((html) => {
    sidebar.innerHTML = html;

    // Resolve the home-page link from this shared script's location so it
    // works whether the sidebar is loaded on the home page or a project page.
    const workLink = sidebar.querySelector(".work-link");
    if (workLink) {
      workLink.href = new URL("index.html", includeScript.src).href;
    }

    // The network markup is part of the sidebar, so initialize it only after
    // the shared HTML has been added to the page.
    const networkScript = document.createElement("script");
    networkScript.src = new URL("script.js", includeScript.src);
    document.body.appendChild(networkScript);
  })
  .catch((error) => console.error("Could not load sidebar:", error));

function getAspectRatio(media) {
  const image = media.querySelector("img");
  if (image?.naturalWidth && image.naturalHeight) {
    return image.naturalWidth / image.naturalHeight;
  }

  const video = media.querySelector("video");
  if (video?.videoWidth && video.videoHeight) {
    return video.videoWidth / video.videoHeight;
  }

  return null;
}

function sizeCaseImageGrid(grid) {
  const mediaItems = [...grid.querySelectorAll(":scope > .case-media")];
  const ratios = mediaItems.map(getAspectRatio);

  if (ratios.length && ratios.every(Boolean)) {
    grid.style.setProperty(
      "--case-image-grid-columns",
      ratios.map((ratio) => `${ratio}fr`).join(" ")
    );
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".case-image-grid").forEach((grid) => {
    const mediaItems = [...grid.querySelectorAll(":scope > .case-media")];

    mediaItems.forEach((media) => {
      const file = media.querySelector("img, video");
      if (file) {
        file.addEventListener("load", () => sizeCaseImageGrid(grid), { once: true });
        file.addEventListener("loadedmetadata", () => sizeCaseImageGrid(grid), { once: true });
      }
    });

    sizeCaseImageGrid(grid);
  });
});
