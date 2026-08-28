const sidebar = document.querySelector("#sidebar-placeholder");
const includeScript = document.currentScript;

function updateActiveProjectLink(url) {
  const activePath = new URL(url, window.location.href).pathname;

  document.querySelectorAll(".project-row[data-project-path]").forEach((link) => {
    link.classList.toggle("is-active", new URL(link.href).pathname === activePath);
  });
}

fetch(new URL("sidebar.html", includeScript.src))
  .then((response) => response.text())
  .then((html) => {
    sidebar.innerHTML = html;

    // Resolve shared navigation from this script's location so it works on
    // both the home page and nested project pages.
    const sidebarLinks = {
      'a[href="index.html"]': "index.html",
      'a[href="project-pages/play.html"]': "project-pages/play.html",
      'a[href="project-pages/about.html"]': "project-pages/about.html"
    };

    Object.entries(sidebarLinks).forEach(([selector, path]) => {
      const link = sidebar.querySelector(selector);
      if (link) link.href = new URL(path, includeScript.src).href;
    });

    sidebar.querySelectorAll("[data-project-path]").forEach((link) => {
      link.href = new URL(link.dataset.projectPath, includeScript.src).href;
    });
    updateActiveProjectLink(window.location.href);

    // The network markup is part of the sidebar, so initialize it only after
    // the shared HTML has been added to the page.
    const networkScript = document.createElement("script");
    networkScript.src = new URL("script.js", includeScript.src);
    document.body.appendChild(networkScript);
  })
  .catch((error) => console.error("Could not load sidebar:", error));

function getAspectRatio(media) {
  const image = media.matches("img") ? media : media.querySelector("img");
  if (image?.naturalWidth && image.naturalHeight) {
    return image.naturalWidth / image.naturalHeight;
  }

  const video = media.matches("video") ? media : media.querySelector("video");
  if (video?.videoWidth && video.videoHeight) {
    return video.videoWidth / video.videoHeight;
  }

  return null;
}

function sizeCaseImageGrid(grid) {
  const mediaItems = [...grid.querySelectorAll(":scope > .case-media, :scope > img, :scope > video")];
  const ratios = mediaItems.map(getAspectRatio);

  if (ratios.length && ratios.every(Boolean)) {
    grid.style.setProperty(
      "--case-image-grid-columns",
      ratios.map((ratio) => `${ratio}fr`).join(" ")
    );
  }
}

function initializeCaseImageGrids(container = document) {
  container.querySelectorAll(".case-image-grid").forEach((grid) => {
    const mediaItems = [...grid.querySelectorAll(":scope > .case-media, :scope > img, :scope > video")];

    mediaItems.forEach((media) => {
      const file = media.matches("img, video") ? media : media.querySelector("img, video");
      if (!file) return;

      file.addEventListener("load", () => sizeCaseImageGrid(grid), { once: true });
      file.addEventListener("loadedmetadata", () => sizeCaseImageGrid(grid), { once: true });
    });

    sizeCaseImageGrid(grid);
  });
}

async function navigatePortfolioPage(url, { updateHistory = true } = {}) {
  const destination = new URL(url, window.location.href);
  const response = await fetch(destination.href);

  if (!response.ok) throw new Error(`Could not load ${destination.pathname}`);

  const documentFragment = new DOMParser().parseFromString(await response.text(), "text/html");
  const nextProjects = documentFragment.querySelector("main .projects");
  const currentProjects = document.querySelector("main .projects");

  if (!nextProjects || !currentProjects) {
    window.location.href = destination.href;
    return;
  }

  // Resolve case-study media against the page it came from before inserting it.
  nextProjects.querySelectorAll("[src], [poster]").forEach((element) => {
    ["src", "poster"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, new URL(value, destination).href);
    });
  });

  currentProjects.replaceWith(nextProjects);
  document.title = documentFragment.title;

  const isProjectOrPlayPage = nextProjects.matches(".project-page") && nextProjects.querySelector(".case-title");
  window.dispatchEvent(new CustomEvent("portfolio:navigation-view", {
    detail: { list: Boolean(isProjectOrPlayPage) }
  }));

  if (updateHistory) history.pushState({}, "", destination.href);
  updateActiveProjectLink(destination.href);

  window.scrollTo(0, 0);
  initializeCaseImageGrids(nextProjects);
}

window.navigatePortfolioPage = navigatePortfolioPage;

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.button !== 0 || link.target || link.hasAttribute("download")) return;

  const destination = new URL(link.href, window.location.href);
  const isPortfolioPage = destination.origin === window.location.origin && destination.pathname.endsWith(".html");

  if (!isPortfolioPage || destination.hash) return;

  event.preventDefault();
  navigatePortfolioPage(destination.href).catch(() => {
    window.location.href = destination.href;
  });
});

window.addEventListener("popstate", () => {
  navigatePortfolioPage(window.location.href, { updateHistory: false }).catch(() => {
    window.location.reload();
  });
});

window.addEventListener("DOMContentLoaded", () => {
  initializeCaseImageGrids();
});
