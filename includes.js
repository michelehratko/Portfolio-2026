const sidebar = document.querySelector("#sidebar-placeholder");
const includeScript = document.currentScript;

fetch(new URL("sidebar.html", includeScript.src))
  .then((response) => response.text())
  .then((html) => {
    sidebar.innerHTML = html;

    // The network markup is part of the sidebar, so initialize it only after
    // the shared HTML has been added to the page.
    const networkScript = document.createElement("script");
    networkScript.src = new URL("script.js", includeScript.src);
    document.body.appendChild(networkScript);
  })
  .catch((error) => console.error("Could not load sidebar:", error));
