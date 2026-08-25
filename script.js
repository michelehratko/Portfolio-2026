/* interactive portfolio network */

const stage = document.querySelector(".portfolio-network");
const field = stage.querySelector("#field");
const linesSvg = stage.querySelector("#lines");
const title = stage.querySelector("#stateTitle");
const counter = stage.querySelector("#stateCounter");
const shuffleButton = stage.querySelector("#shuffle");

const SIM_WIDTH = 340;
const SIM_HEIGHT = 200;

function stageWidth() {
  return SIM_WIDTH;
}

function stageHeight() {
  return SIM_HEIGHT;
}

function drawX(x) {
  const w = Math.max(1, stage.getBoundingClientRect().width);
  return x * (w / SIM_WIDTH);
}

function drawY(y) {
  const h = Math.max(1, stage.getBoundingClientRect().height);
  return y * (h / SIM_HEIGHT);
}

const projects = [
  { id: 1, title: "Lunar Gala: Fable", type: ["brand", "editorial"], role: "lead", process: ["leading"], reach: "regional", client: "club" },
  { id: 2, title: "Who Owns This Book?", type: ["editorial"], role: "solo", process: ["research", "production"], reach: "global", client: "coursework" },
  { id: 3, title: "Apple Internship", type: ["brand"], role: "team", process: ["learning"], reach: "global", client: "intern" },
  { id: 4, title: "Pittsburgh Air Quality", type: ["data", "editorial"], role: "solo", process: ["research"], reach: "school", client: "coursework" },
  { id: 5, title: "Internet Archive Redesign", type: ["brand"], role: "solo", process: ["experimenting"], reach: "school", client: "coursework" },
  { id: 6, title: "Visualizing the Long Life of Compliments", type: ["data"], role: "solo", process: ["experimenting", "production"], reach: "school", client: "coursework" },
  { id: 7, title: "Celebrating Giorgia Lupi", type: ["data", "editorial"], role: "solo", process: ["experimenting", "learning"], reach: "school", client: "coursework" },
  { id: 8, title: "Ovation Film Festival", type: ["brand"], role: "solo", process: ["experimenting"], reach: "regional", client: "club" }
];

const stateDefinitions = [
  {
    title: "type of work",
    field: "type",
    labels: {
        editorial: { x: .18, y: .20 },
        brand: { x: .45, y: .74 },
        data: { x: .80, y: .34 }
    }
  },
  {
    title: "role",
    field: "role",
    labels: {
        solo: { x: .16, y: .30 },
        team: { x: .80, y: .24 },
        lead: { x: .48, y: .72 }
    }
  },
  {
    title: "process / skills",
    field: "process",
    labels: {
        research: { x: .18, y: .24 },
        leading: { x: .62, y: .18 },
        production: { x: .84, y: .48 },
        experimenting: { x: .22, y: .76 },
        learning: { x: .66, y: .82 }
    }
  },
  {
    title: "reach",
    field: "reach",
    labels: {
        regional: { x: .18, y: .68 },
        global: { x: .68, y: .20 },
        school: { x: .76, y: .78 }
    }
  },
  {
    title: "client",
    field: "client",
    labels: {
        coursework: { x: .18, y: .30 },
        club: { x: .58, y: .78 },
        intern: { x: .82, y: .22 }
    }
  }
];

function entriesFor(project, fieldName) {
  const value = project[fieldName];

  return Array.isArray(value)
    ? value.map(v => String(v).toLowerCase().trim())
    : [String(value).toLowerCase().trim()];
}

function buildState(def) {
  const links = {};

  projects.forEach(project => {
    links[project.id] = entriesFor(project, def.field);
  });

  return {
    title: def.title,
    labels: def.labels,
    links
  };
}

const states = stateDefinitions.map(buildState);

const nodes = [];
const labels = new Map();
const lines = [];

let stateIndex = 0;
let active = states[0];
let transitionStart = performance.now();
let impulseFlip = 1;
let hoveredProjectId = null;

const hoverTitle = document.createElement("div");
hoverTitle.className = "hover-title";
field.appendChild(hoverTitle);

projects.forEach(project => {
  const el = document.createElement("div");
  el.className = "dot";
  el.dataset.id = `[${project.id}]`;
  el.title = project.title;

  el.addEventListener("mouseenter", () => {
    hoveredProjectId = project.id;
    hoverTitle.textContent = project.title;
    hoverTitle.classList.add("is-visible");
  });

  el.addEventListener("mouseleave", () => {
    hoveredProjectId = null;
    hoverTitle.classList.remove("is-visible");
  });

  field.appendChild(el);

  const initialX = stageWidth() / 2 + Math.random() * 80 - 40;
  const initialY = stageHeight() / 2 + Math.random() * 80 - 40;

  nodes.push({
    id: project.id,
    el,
    x: initialX,
    y: initialY,
    displayX: initialX,
    displayY: initialY,
    vx: 0,
    vy: 0
  });
});

function getLabel(name) {
  if (labels.has(name)) return labels.get(name);

  const el = document.createElement("div");
  el.className = "label";
  el.textContent = name;
  field.appendChild(el);

  const label = {
    name,
    el,
    x: stageWidth() / 2,
    y: stageHeight() / 2,
    tx: stageWidth() / 2,
    ty: stageHeight() / 2,
    vx: 0,
    vy: 0,
    opacity: 0,
    targetOpacity: 0
  };

  labels.set(name, label);
  return label;
}

function resetLines() {
  linesSvg.innerHTML = "";
  lines.length = 0;

  Object.entries(active.links).forEach(([id, labelNames]) => {
    labelNames.forEach(name => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      linesSvg.appendChild(line);
      lines.push({ line, id: Number(id), label: name });
    });
  });
}

function useState(next) {
  active = next;
  transitionStart = performance.now();

  title.textContent = active.title;
  counter.textContent = `${String((stateIndex % states.length) + 1).padStart(2, "0")}/${String(states.length).padStart(2, "0")}`;

  labels.forEach(label => {
    label.targetOpacity = 0;
  });

  Object.entries(active.labels).forEach(([name, pos]) => {
    const label = getLabel(name);
    label.tx = pos.x * stageWidth();
    label.ty = pos.y * stageHeight();
    label.targetOpacity = 1;
  });

  impulseFlip *= -1;

  nodes.forEach(node => {
    const linked = linkedLabels(node);
    if (!linked.length) return;

    const cx = linked.reduce((sum, label) => sum + label.x, 0) / linked.length;
    const cy = linked.reduce((sum, label) => sum + label.y, 0) / linked.length;

    const dx = node.x - cx;
    const dy = node.y - cy;
    const dist = Math.max(1, Math.hypot(dx, dy));

    const tx = -dy / dist;
    const ty = dx / dist;

    node.vx += tx * 1.0 * impulseFlip + (cx - node.x) * 0.02;
    node.vy += ty * 1.0 * impulseFlip + (cy - node.y) * 0.02;
  });

  resetLines();
}

function shuffle() {
  useState(states[stateIndex % states.length]);
  stateIndex++;
}

function linkedLabels(node) {
  return (active.links[node.id] || [])
    .map(name => labels.get(name))
    .filter(Boolean);
}

function labelEdgePoint(label, x, y) {
  const rect = label.el.getBoundingClientRect();
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;

  const labelDrawX = drawX(label.x);
  const labelDrawY = drawY(label.y);
  const pointDrawX = drawX(x);
  const pointDrawY = drawY(y);

  const dx = pointDrawX - labelDrawX;
  const dy = pointDrawY - labelDrawY;

  if (dx === 0 && dy === 0) {
    return { x: labelDrawX, y: labelDrawY };
  }

  const scale = Math.min(
    Math.abs(halfW / dx) || Infinity,
    Math.abs(halfH / dy) || Infinity
  );

  return {
    x: labelDrawX + dx * scale,
    y: labelDrawY + dy * scale
  };
}

function labelEdgePointSim(label, x, y) {
  const rect = label.el.getBoundingClientRect();
  const sx = stage.getBoundingClientRect().width / SIM_WIDTH;
  const sy = stage.getBoundingClientRect().height / SIM_HEIGHT;

  const halfW = (rect.width / 2 + 14) / Math.max(sx, 0.0001);
  const halfH = (rect.height / 2 + 10) / Math.max(sy, 0.0001);

  const dx = x - label.x;
  const dy = y - label.y;

  if (dx === 0 && dy === 0) {
    return { x: label.x, y: label.y };
  }

  const scale = Math.min(
    Math.abs(halfW / dx) || Infinity,
    Math.abs(halfH / dy) || Infinity
  );

  return {
    x: label.x + dx * scale,
    y: label.y + dy * scale
  };
}

function applyForces() {
  labels.forEach(label => {
    const elapsed = performance.now() - transitionStart;
    const easeIn = Math.min(1, elapsed / 220);
    const eased = easeIn * easeIn * (3 - 2 * easeIn);

    label.vx += (label.tx - label.x) * 0.009 * eased;
    label.vy += (label.ty - label.y) * 0.009 * eased;
    label.vx *= 0.78;
    label.vy *= 0.78;
    label.x += label.vx;
    label.y += label.vy;

    if (label.targetOpacity === 0) {
      label.opacity += (0 - label.opacity) * 0.32;
      if (label.opacity < 0.02) label.opacity = 0;
    } else {
      label.opacity += (1 - label.opacity) * 0.18;
    }
  });

  nodes.forEach(node => {
    const linked = linkedLabels(node);

    linked.forEach(label => {
      const edge = labelEdgePointSim(label, node.x, node.y);
      const dx = edge.x - node.x;
      const dy = edge.y - node.y;
      const dist = Math.max(1, Math.hypot(dx, dy));

      const desired = linked.length > 1 ? 32 : 24;

      const elapsed = performance.now() - transitionStart;
      const easeIn = Math.min(1, elapsed / 140);
      const eased = easeIn * easeIn * (3 - 2 * easeIn);

      const pull = (dist - desired) * 0.014;

      node.vx += (dx / dist) * pull * 0.85;
      node.vy += (dy / dist) * pull;

      label.vx -= (dx / dist) * pull * 0.08;
      label.vy -= (dy / dist) * pull * 0.08;
    });
  });

  labels.forEach(label => {
    if (label.targetOpacity < 0.01) return;

    const rect = label.el.getBoundingClientRect();
    const sx = stage.getBoundingClientRect().width / SIM_WIDTH;
    const sy = stage.getBoundingClientRect().height / SIM_HEIGHT;

    const halfW = (rect.width / 2 + 26) / Math.max(sx, 0.0001);
    const baseHalfH = rect.height / 2;

    nodes.forEach(node => {
      const dx = node.x - label.x;
      const dy = node.y - label.y;
      const halfH = (baseHalfH + (dy < 0 ? 30 : 14)) / Math.max(sy, 0.0001);

      if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
        const px = (halfW - Math.abs(dx)) / halfW;
        const py = (halfH - Math.abs(dy)) / halfH;

        if (px < py) {
          node.vx += (dx >= 0 ? 1 : -1) * px * 1.35; 
        } else {
          node.vy += (dy >= 0 ? 1 : -1) * py * 1.35; 
        }
      }
    });
  });

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const min = 50;

      if (dist < 0.01) {
        const angle = ((a.id * 37 + b.id * 61) % 360) * Math.PI / 180;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        dist = 1;
      }

      if (dist < min) {
        const push = (min - dist) * 0.018;
        const ux = dx / dist;
        const uy = dy / dist;

        a.vx -= ux * push;
        a.vy -= uy * push;
        b.vx += ux * push;
        b.vy += uy * push;
      }
    }
  }

  const activeLabels = [...labels.values()].filter(label => label.opacity > 0.02 || label.targetOpacity > 0);

  for (let i = 0; i < activeLabels.length; i++) {
    for (let j = i + 1; j < activeLabels.length; j++) {
      const a = activeLabels[i];
      const b = activeLabels[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const min = 76;

      if (dist < min) {
        const push = (min - dist) * 0.0018;
        const ux = dx / dist;
        const uy = dy / dist;

        a.vx -= ux * push;
        a.vy -= uy * push;
        b.vx += ux * push;
        b.vy += uy * push;
      }
    }
  }

  nodes.forEach(node => {
    const elapsed = performance.now() - transitionStart;
    const reorganize = Math.max(0, 1 - elapsed / 900);

    const cdx = node.x - stageWidth() / 2;
    const cdy = node.y - stageHeight() / 2;
    const cdist = Math.max(1, Math.hypot(cdx, cdy));

    node.vx += (cdx / cdist) * 0.08 * reorganize;
    node.vy += (cdy / cdist) * 0.08 * reorganize;

    if (node.id === hoveredProjectId) {
      node.vx = 0;
      node.vy = 0;
    } else {
      node.vx *= 0.66;
      node.vy *= 0.66;
      node.x += node.vx;
      node.y += node.vy;
    }

    const pad = 12;

    if (node.x < pad) {
      node.x = pad;
      node.vx *= -0.2;
    }

    if (node.x > stageWidth() - pad) {
      node.x = stageWidth() - pad;
      node.vx *= -0.2;
    }

    if (node.y < pad) {
      node.y = pad;
      node.vy *= -0.2;
    }

    if (node.y > stageHeight() - pad) {
      node.y = stageHeight() - pad;
      node.vy *= -0.2;
    }
  });
}

function render() {
  labels.forEach(label => {
    label.el.style.opacity = label.opacity;
    label.el.style.transform = `translate(${drawX(label.x)}px, ${drawY(label.y)}px) translate(-50%, -50%)`;
  });

  nodes.forEach(node => {
    node.displayX += (node.x - node.displayX) * 0.14;
    node.displayY += (node.y - node.displayY) * 0.14;
    node.el.style.transform = `translate(${drawX(node.displayX)}px, ${drawY(node.displayY)}px) translate(-50%, -50%)`;
  });

  if (hoveredProjectId !== null) {
    const hovered = nodes.find(node => node.id === hoveredProjectId);

    if (hovered) {
      const offset = 8;
      const rect = hoverTitle.getBoundingClientRect();

      let x = drawX(hovered.displayX) + offset;
      let y = drawY(hovered.displayY);

      if (x + rect.width > stage.getBoundingClientRect().width - 8) {
        x = drawX(hovered.displayX) - rect.width - offset;
      }

      x = Math.max(8, Math.min(stage.getBoundingClientRect().width - rect.width - 8, x));
      y = Math.max(12, Math.min(stage.getBoundingClientRect().height - 20, y));

      hoverTitle.style.left = `${x}px`;
      hoverTitle.style.top = `${y}px`;
    }
  }

  lines.forEach(({ line, id, label }) => {
    const node = nodes.find(item => item.id === id);
    const labelObj = labels.get(label);

    if (!node || !labelObj) return;

    const edge = labelEdgePoint(labelObj, node.displayX, node.displayY);

    const elapsed = performance.now() - transitionStart;
    const grow = Math.min(1, Math.max(0, (elapsed - 90) / 340));
    const easedGrow = grow * grow * (3 - 2 * grow);

    const nodeX = drawX(node.displayX);
    const nodeY = drawY(node.displayY);

    const mx = (nodeX + edge.x) / 2;
    const my = (nodeY + edge.y) / 2;

    const x1 = mx + (nodeX - mx) * easedGrow;
    const y1 = my + (nodeY - my) * easedGrow;
    const x2 = mx + (edge.x - mx) * easedGrow;
    const y2 = my + (edge.y - my) * easedGrow;

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.style.opacity = labelObj.targetOpacity === 0 ? 0 : Math.min(0.9, labelObj.opacity) * easedGrow;
  });
}

function tick() {
  applyForces();
  render();
  requestAnimationFrame(tick);
}

shuffleButton.addEventListener("click", event => {
  event.stopPropagation();
  shuffle();
});

field.addEventListener("click", shuffle);

window.addEventListener("resize", render);

function updateListSubtitleVisibility() {
  const list = document.querySelector(".project-list-view");
  if (!list) return;

  const rows = [...list.querySelectorAll(".project-row")];
  const availableWidth = list.clientWidth;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  let widestName = 0;
  let widestSubtitle = 0;

  rows.forEach(row => {
    const name = row.querySelector(".list-name");
    const subtitle = row.querySelector("span:not(.list-name)");
    if (!name || !subtitle) return;

    const nameStyle = getComputedStyle(name);
    const subtitleStyle = getComputedStyle(subtitle);

    context.font = nameStyle.font;
    widestName = Math.max(
      widestName,
      context.measureText(name.textContent.trim()).width
    );
    context.font = subtitleStyle.font;
    widestSubtitle = Math.max(
      widestSubtitle,
      context.measureText(subtitle.textContent.trim()).width
    );
  });

  const hoverIndent = 20;
  const columnGap = 16;
  const needsMoreSpace = widestName + widestSubtitle + hoverIndent + columnGap > availableWidth;

  list.classList.toggle("hide-subtitles", needsMoreSpace);
}

window.addEventListener("resize", updateListSubtitleVisibility);
document.fonts.ready.then(updateListSubtitleVisibility);
updateListSubtitleVisibility();

shuffle();
tick();

{
  const workView = document.querySelector(".work-view");
  const viewToggle = document.querySelector("#viewToggle");

  if (workView && viewToggle) {

  const compactView = window.matchMedia("(max-width: 1100px)");
  let prefersListView = workView.classList.contains("show-list");

  function setListView(isList) {
    workView.classList.toggle("show-list", isList);
    viewToggle.textContent = isList ? "Data View" : "List View";

    if (!isList && typeof render === "function") {
      requestAnimationFrame(render);
    }
  }

  function syncResponsiveView() {
    setListView(compactView.matches || prefersListView);
  }

  viewToggle.addEventListener("click", () => {
    prefersListView = !workView.classList.contains("show-list");
    setListView(prefersListView);
  });

  compactView.addEventListener("change", syncResponsiveView);
    syncResponsiveView();
  }
}
