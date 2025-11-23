console.log("stack loaded");

let sources = new Map();
let codes = new Map();
let test = new Map();

let el;
let interfaceEl;
let codeEl;
let cameraEl;
let deleteEl = null;

const operators = ["+", "-", "*", "/", "0", ">", "<", "$", "_", "#", "~", "!", "%", "&", "|", "^", "@", "n"];

// Setup Kill Switch
// Kill Switch Setup
let killSwitchLastPress = 0;
let killSwitchCounter = 0;
const killSwitchDelay = 500; // milliseconds between presses

document.addEventListener("keydown", (e) => {
  if (e.key === ".") {
    const currentTime = Date.now();

    if (currentTime - killSwitchLastPress < killSwitchDelay) {
      // Increment counter if within delay
      killSwitchCounter++;
    } else {
      // Reset counter if too much time has passed
      killSwitchCounter = 1;
    }

    killSwitchLastPress = currentTime;

    if (killSwitchCounter >= 3) {
      // Triple press detected - execute kill switch
      console.log("Kill switch activated - destroying all sources and codes");

      document.querySelectorAll("[id*='src'], [id*='cod']").forEach((element) => {
        // Check if element ID matches pattern: src/cod + integer(s) + underscore
        const id = element.id;
        if (!/(?:src|cod)\d+_/.test(id)) return;

        const key = element.id;
        const el = document.getElementById(key);
        if (el) {
          el.setAttribute("sblove_deregister", "entity", key);
          el.parentNode?.removeChild(el);
        }
      });

      // Clear maps
      sources.clear();
      codes.clear();

      // Reset kill switch counter
      killSwitchCounter = 0;
      killSwitchLastPress = 0;
    }
  }
});

//Killswitch End

class stackbeatSynth {
  constructor(audio) {
    this.audio = audio;
    this.code = this.parse("");
    this.g = Function("s,R", "s=[R=s];" + this.code + "return s.pop()");
    this.lastCode = this.code;
    this.bytebeatWorker = false;
  }

  // Based on StackBeat JavaScript implementation found at esolangs: https://esolangs.org/wiki/StackBeat
  parse(code) {
    let w = code.split("");
    let r = "";
    let v = "";
    let e;
    let a = 1 * 8e3;
    while ((e = w.shift())) {
      +e == e ? (v += e) : v && ((r += "Y(" + +v + ");"), (v = "")),
        (r +=
          (e == "@"
            ? "s=s.concat(s.slice(-1))"
            : e == "_"
            ? "Y(R)"
            : e == "$"
            ? "Z"
            : e == "#"
            ? "Y(Z,Z)"
            : ~"+-*/%^&|".indexOf(e)
            ? "Y(Z" + e + "Z)"
            : ~"<>".indexOf(e)
            ? "Y(Z" + e + e + "Z)"
            : ~"~!".indexOf(e)
            ? "Y(+" + e + "Z)"
            : "") + ";");
    }

    return r.replace(/Z/g, "s.pop()").replace(/Y/g, "s.push");
  }

  async init() {
    let actx = (this.audioCtx = document.querySelector("a-resonance-audio-room").components["resonance-audio-room"].audioContext);
    await console.log("wait...");

    await this.audioCtx.audioWorklet.addModule("./aframe-stackbeat_love/stackbeat-worker.js");

    this.stackbeatWorker = new AudioWorkletNode(this.audioCtx, "stackbeat-worker");

    this.streamDestination = this.audioCtx.createMediaStreamDestination();
    this.source = this.audioCtx.createBufferSource();

    this.myArrayBuffer = this.audioCtx.createBuffer(1, 48000 * 1, 48000);
    this.source.buffer = this.myArrayBuffer;
    this.source.connect(this.streamDestination);
    this.source.start();

    this.stackbeatWorker.connect(this.streamDestination);

    this.stream = this.streamDestination.stream;

    this.audio.setAttribute("resonance-audio-src", "src", this.stream);
  }

  update(code) {
    this.code = this.parse(code);
    if (this.stackbeatWorker) {
      this.stackbeatWorker.port.postMessage(this.code);
    }
  }
}

AFRAME.registerComponent("sblove_register", {
  schema: {
    entity: { default: "" },
  },
  init: function () {
    var el = this.el;
    const data = this.data.entity.split("|");
    console.log(data);

    if (data[0].includes("cod")) {
      codes.set(data[0], {
        x: data[1],
        y: data[2],
        z: data[3],
      });
    }
    if (data[0].includes("src")) {
      sources.set(data[0], {
        x: data[1],
        y: data[2],
        z: data[3],
        radius: data[4],
      });
    }
  },
  update: function () {
    var el = this.el;
    const data = this.data.entity.split("|");
    //console.log(data);

    if (data[0].includes("cod")) {
      codes.set(data[0], {
        x: data[1],
        y: data[2],
        z: data[3],
      });
      CodeParser();
    }
    if (data[0].includes("src")) {
      sources.set(data[0], {
        x: data[1],
        y: data[2],
        z: data[3],
        radius: data[4],
      });
      CodeParser();
    }
  },
});

AFRAME.registerComponent("sblove_deregister", {
  schema: {
    entity: { default: "" },
  },
  init: function () {
    var el = this.el;
    //console.log(this.data);
  },
  update: function () {
    var el = this.el;

    if (this.data.entity.includes("naf")) {
      this.data.entity = this.data.entity.replace("naf-", "");
      //console.log(this.data.entity);
    }

    if (this.data.entity.includes("cod")) {
      //codes.delete(this.data.entity);
      codes.delete(this.data.entity.split("_")[0]);
      console.log("deleted cod", codes);
      CodeParser();
    }
    if (this.data.entity.includes("src")) {
      //sources.delete(this.data.entity);
      sources.delete(this.data.entity.split("_")[0]);
      console.log("deleted src", sources);
      CodeParser();
    }
  },
});

AFRAME.registerComponent("sblove_destroy", {
  init: function () {
    var el = this.el;
    /*
    el.addEventListener("rasycaster-intersected", (evt) => {
      console.log("ray intersect", evt);
      deleteEl = evt.target;
    });
    el.addEventListener("raycaster-intersected-cleared", (evt) => {
      deleteEl = null;
    });
    */
    /*
    el.addEventListener('click', function () {
      let id = el.getAttribute('id');
      

      if (id.includes('naf') != true) {
        el.setAttribute('sblove_deregister', 'entity', id);
        setTimeout(() => {
          el.destroy();
          el.parentNode?.removeChild(el); 
          
        }, '1000');
      }
    });
    */
  },
});

function distance3d(vec1, vec2) {
  var dx = vec1.x - vec2.x;
  var dy = vec1.y - vec2.y;
  var dz = vec1.z - vec2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Helper: Find element by ID with fallback strategies
function findElement(baseId) {
  const searchIds = [baseId + "_" + NAF.clientId, "naf-" + baseId + "_" + NAF.clientId, baseId, "naf-" + baseId];

  for (const id of searchIds) {
    const el = document.getElementById(id);
    if (el) return el;
  }

  // Fallback: querySelector for partial match
  const matches = document.querySelectorAll(`[id*="${baseId}"]`);
  return matches.length > 0 ? matches[0] : null;
}

function drawLines(nodeIds, srcId) {
  // Remove existing lines for this specific srcId
  const existingLines = document.querySelectorAll(`.connection-line-${srcId}`);
  existingLines.forEach((line) => line.parentNode?.removeChild(line));

  // Generate a consistent color based on srcId
  function getColorForSrcId(id) {
    // Simple hash function to generate consistent color from string
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }

  const lineColor = getColorForSrcId(srcId);

  // Draw lines between consecutive nodes
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const startEl = findElement(nodeIds[i]);
    const endEl = findElement(nodeIds[i + 1]);

    if (startEl && endEl) {
      const startPos = startEl.getAttribute("position");
      const endPos = endEl.getAttribute("position");

      const line = document.createElement("a-entity");
      line.classList.add("connection-line", `connection-line-${srcId}`);

      // Calculate distance and midpoint
      const dx = endPos.x - startPos.x;
      const dy = endPos.y - startPos.y;
      const dz = endPos.z - startPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const midX = (startPos.x + endPos.x) / 2;
      const midY = (startPos.y + endPos.y) / 2;
      const midZ = (startPos.z + endPos.z) / 2;

      line.setAttribute("geometry", {
        primitive: "cylinder",
        radius: 0.02,
        height: distance,
      });
      line.setAttribute("material", {
        color: lineColor,
        opacity: 1,
      });
      line.setAttribute("position", `${midX} ${midY} ${midZ}`);

      // Calculate rotation to point from start to end
      const direction = new THREE.Vector3(dx, dy, dz).normalize();
      const axis = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);
      line.object3D.rotation.copy(euler);

      document.querySelector("a-scene").appendChild(line);
    }
  }
}

function CodeParser() {
  // Process each source
  sources.forEach((srcPos, sourceKey) => {
    const codesInRange = [];

    // Collect all codes within range
    codes.forEach((codPos, codeKey) => {
      const dist = distance3d(srcPos, codPos);

      if (dist <= srcPos.radius) {
        const el = findElement(codeKey);

        if (el?.components?.text) {
          const codeValue = el.components.text.attrValue.value;
          codesInRange.push({
            id: codeKey,
            type: codeValue,
            dist: dist,
          });
        } else {
          console.log("Element or text component not found for:", codeKey);
        }
      }
    });

    // Sort by distance
    codesInRange.sort((a, b) => a.dist - b.dist);

    // Build final code string
    const finalCode = codesInRange.map((item) => (item.type === "n" ? Math.round(item.dist) : item.type)).join("");
    drawLines(codesInRange.map((item) => item.id), sourceKey);

    //console.log(`Source ${sourceKey}: codes in range`, codesInRange, "→", finalCode);

    // Update source with final code
    const sourceEl = findElement(sourceKey);
    if (sourceEl) {
      sourceEl.setAttribute("stackbeat_love", { code: finalCode });
    }
  });
}

AFRAME.registerComponent("stackbeat_love", {
  synth: null,
  schema: {
    code: { type: "string", default: "" },
  },
  init: function () {
    let el = this.el;
    //(this.data);
    this.el.setAttribute("text", "value", this.data.code);

    this.synth = new stackbeatSynth(el);

    this.synth.init();
    this.el.play();
    this.el.addEventListener("ElementAdded", () => {
      console.log("added");
    });
  },
  update: function () {
    var data = this.data;
    var el = this.el;
    //console.log(this.data);

    var resonanceRoom = document.querySelector("a-resonance-audio-room");
    el.setAttribute("resonance-audio-src", "room", resonanceRoom);
    el.setAttribute("resonance-audio-src", "position", el.components["position"].attrValue);

    //this.el.setAttribute("text", "value", data.code);

    this.el.setAttribute("text", {
      value: data.code,
      height: 20,
      width: 40,
      wrapCount: 40,
      color: "#FFFFFF",
      align: "center",
    });
    this.el.object3D.scale.x = -1;

    this.synth.update(data.code);
  },
});

/* global AFRAME, NAF */
AFRAME.registerComponent("stackbeat_love-drop", {
  schema: {
    template: { default: "" },
    keyCode: { default: 48 },
    radius: { default: 10 },
  },

  init: function () {
    this.onKeyPress = this.onKeyPress.bind(this);
    //document.addEventListener('keypress', this.onKeyPress);
    document.addEventListener("operator", this.onKeyPress);
  },

  onKeyPress: function (e) {
    console.log("keypress", e);
    const value = e.keyCode || e.detail;
    if (!operators.includes(value)) return;
    const isMainsource = value === "0" || value === 48;

    function addId(map) {
      console.log("create new id", map, Array.from(map.keys()), Array.from(map.keys()).length);
      const ids = Array.from(map.keys()).map((k) => parseInt(k.match(/\d+/g)));
      const val = ids.length === 0 ? 0 : Math.max(...ids) + 1;
      console.log("new Id", val, ids);
      return val;
    }

    const el = document.createElement("a-entity");

    el.addEventListener("raycaster-intersected", (evt) => {
      deleteEl = null;
      const rayOrigin = evt.detail.el.components.raycaster.raycaster.ray.origin;
      const boundingBox = new THREE.Box3().setFromObject(evt.target.object3D);

      //check if raycast was outside bbox
      if (!boundingBox.containsPoint(rayOrigin)) {
        deleteEl = evt.target;
        //console.log("Element to Delete", deleteEl);
      }
    });
    el.addEventListener("raycaster-intersected-cleared", (evt) => {
      deleteEl = null;
      //console.log("Element to Delete", deleteEl);
    });

    if (isMainsource) {
      const newId = addId(sources);
      const sourceId = "src" + newId + "_" + NAF.clientId;
      //el.setAttribute("id", "src" + sources.size);
      el.setAttribute("id", sourceId);
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-mainsource-template",
      });

      // this.data.radius = Math.random() * 30 + 10;
      // console.log("RADIUS:", this.data.radius);

      //el.setAttribute("networked", "networkId", "src" + sources.size);
      el.setAttribute("networked", "networkId", sourceId);
      el.setAttribute("position", this.el.getAttribute("position"));
      el.setAttribute(
        "sblove_register",
        "entity",
        sourceId + "|" + this.el.getAttribute("position").x + "|" + this.el.getAttribute("position").y + "|" + this.el.getAttribute("position").z + "|" + this.data.radius
      );

      this.el.sceneEl.appendChild(el);

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        const geom = networkedEl.getAttribute("geometry");
        networkedEl.setAttribute("geometry", {
          ...geom,
          radius: this.data.radius,
        });
        document.body.dispatchEvent(new CustomEvent("persistentEntityCreated", { detail: { el: el } }));
      });
    } else {
      el.setAttribute("networked", {
        persistent: true,
        template: "#stackbeat_love-codesource-template",
      });
      const newId = addId(codes);
      const codeId = "cod" + newId + "_" + NAF.clientId;
      //el.setAttribute("networked", "networkId", "cod" + codes.size);
      //el.setAttribute("id", "cod" + codes.size);
      el.setAttribute("networked", "networkId", codeId);
      el.setAttribute("id", codeId);
      el.setAttribute("position", this.el.getAttribute("position"));

      /*
      const throwDur = 500;
      throwElement(el, throwDur);
      setTimeout(() => {
        el.setAttribute(
          "sblove_register",
          "entity",
          "cod" +
            codes.size +
            "|" +
            this.el.getAttribute("position").x +
            "|" +
            this.el.getAttribute("position").y +
            "|" +
            this.el.getAttribute("position").z
        );

        el.setAttribute("text", { value: value });

        this.el.sceneEl.appendChild(el);
      }, throwDur + 10);
      */

      el.setAttribute("sblove_register", "entity", "cod" + newId + "|" + this.el.getAttribute("position").x + "|" + this.el.getAttribute("position").y + "|" + this.el.getAttribute("position").z);

      el.setAttribute("text", { value: value });

      this.el.sceneEl.appendChild(el);

      NAF.utils.getNetworkedEntity(el).then((networkedEl) => {
        document.body.dispatchEvent(new CustomEvent("persistentEntityCreated", { detail: { el: el } }));
      });
    }
  },
});

function throwElement(element, duration = 500) {
  element.addEventListener("loaded", function () {
    if (!element.object3D) return;

    console.log("Startposition:", element.getAttribute("position"));

    const startPosition = new AFRAME.THREE.Vector3();
    element.object3D.getWorldPosition(startPosition);

    const cameraRig = document.querySelector("#cameraRig") || document.querySelector("[camera]");
    if (!cameraRig || !cameraRig.object3D) return;

    const camera = cameraRig.object3D;
    const direction = new AFRAME.THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.normalize(); // Stelle sicher, dass die Richtung normiert ist

    const throwForce = 5; // Stärke des Wurfs
    const endPosition = startPosition.clone().add(direction.multiplyScalar(-throwForce));
    const startTime = performance.now();

    function animate() {
      const elapsedTime = performance.now() - startTime;
      const t = Math.min(elapsedTime / duration, 1);
      element.object3D.position.lerpVectors(startPosition, endPosition, t);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log("Element geworfen!");
      }
    }

    // Falls das Objekt physikalisch bewegt werden soll
    if (element.body) {
      element.body.applyImpulse(new CANNON.Vec3(direction.x * throwForce, direction.y * throwForce, direction.z * throwForce), new CANNON.Vec3(0, 0, 0));
    } else {
      requestAnimationFrame(animate);
    }
  });
}

AFRAME.registerComponent("follow-ui", {
  schema: {
    deleteEl: { default: [] },
  },
  tick: function () {
    if (!interfaceEl) {
      createFollowUI();
    }
    if (interfaceEl) {
      const cameraPosition = new AFRAME.THREE.Vector3();
      const cameraDirection = new AFRAME.THREE.Vector3();

      // Get the camera's position and direction
      cameraEl.object3D.getWorldPosition(cameraPosition);
      cameraEl.object3D.getWorldDirection(cameraDirection);

      // Position the interfaceEl slightly in front of the camera
      const offsetDistance = -2; // Negative distance to ensure it's in front of the camera
      const targetPosition = cameraPosition.clone().add(cameraDirection.multiplyScalar(offsetDistance));

      // Add inertia by interpolating between the current position and the target position
      const currentPosition = interfaceEl.object3D.position.clone();
      const lerpFactor = 0.1; // Adjust this value for more or less inertia
      const newPosition = currentPosition.lerp(targetPosition, lerpFactor);
      interfaceEl.object3D.position.copy(newPosition);

      // Make the interfaceEl face the camera
      interfaceEl.object3D.lookAt(cameraPosition);

      //Show me what to Delete!!!
      const targetTextEl = interfaceEl.querySelector("#target-text");
      let targetElVal = "";
      if (deleteEl) targetElVal = deleteEl?.id.split("_")[0] + ": " + deleteEl?.components.text.attrValue.value;
      targetTextEl?.setAttribute("value", targetElVal);
    }
  },
  init: function () {
    codeEl = this.el;
    cameraEl = document.querySelector("[camera]");
  },
});

function createFollowUI() {
  //console.log("el", codeEl);
  codeEl.setAttribute("position", "0 2 -2");
  interfaceEl = document.createElement("a-entity");
  const segments = operators.length;
  const colors = ["#FF0000", "#FFFFFF"];

  for (let i = 0; i < segments; i++) {
    const segment = document.createElement("a-entity");
    segment.classList.add("raycastable", "segment");
    segment.setAttribute("geometry", {
      primitive: "ring",
      radiusInner: 0.8,
      radiusOuter: 1.2,
      thetaStart: (360 / segments) * i,
      thetaLength: 360 / segments,
    });
    segment.setAttribute("material", "color", colors[i % colors.length]);
    const textEl = document.createElement("a-text");
    textEl.setAttribute("value", operators[i]);
    textEl.setAttribute("color", "#000000");
    textEl.setAttribute("align", "center");
    textEl.setAttribute("scale", "0.5 0.5 0.5");
    textEl.setAttribute("shader", "msdf");
    textEl.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");

    const angle = (360 / segments) * i;
    const radius = 1;
    const x = radius * Math.cos((angle + 360 / segments / 2) * (Math.PI / 180));
    const y = radius * Math.sin((angle + 360 / segments / 2) * (Math.PI / 180));
    textEl.setAttribute("position", `${x} ${y} 0`);

    segment.appendChild(textEl);
    interfaceEl.appendChild(segment);

    /*
    const usedColors = new Set();
    let randomColor;
    do {
      randomColor = `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;
    } while (
      randomColor.toLowerCase() === "#000000" ||
      usedColors.has(randomColor)
    ); // Ensure the color is not black and not already used
    */
    const cyberpunkColors = [
      "#9400D3", // Dark Violet
      "#8A2BE2", // Blue Violet
      "#7F00FF", // Electric Purple
      "#00FFFF", // Cyan
      "#40E0D0", // Turquoise
      "#00CED1", // Dark Turquoise
      "#DA70D6", // Orchid
      "#48D1CC", // Medium Turquoise
      "#C71585", // Medium Violet Red
      "#20B2AA", // Light Sea Green
    ];

    const usedColors = new Set();

    function getRandomCyberpunkColor() {
      const availableColors = cyberpunkColors.filter((c) => !usedColors.has(c));

      if (availableColors.length > 0) {
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        usedColors.add(randomColor);
        return randomColor;
      } else {
        // All colors used, pick one and tweak it slightly
        const baseColor = cyberpunkColors[Math.floor(Math.random() * cyberpunkColors.length)];
        let modifiedColor = tweakColor(baseColor);
        // Ensure it's still unique
        while (usedColors.has(modifiedColor)) {
          modifiedColor = tweakColor(baseColor);
        }
        usedColors.add(modifiedColor);
        return modifiedColor;
      }
    }

    function tweakColor(hex) {
      // Tweak: increase brightness a bit (up to +15)
      let color = parseInt(hex.slice(1), 16);
      let r = Math.min(((color >> 16) & 0xff) + Math.floor(Math.random() * 16), 255);
      let g = Math.min(((color >> 8) & 0xff) + Math.floor(Math.random() * 16), 255);
      let b = Math.min((color & 0xff) + Math.floor(Math.random() * 16), 255);
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
    // usage
    const randomColor = getRandomCyberpunkColor();
    segment.setAttribute("material", "color", randomColor);
    usedColors.add(randomColor);
    segment.setAttribute("material", "color", randomColor);

    segment.addEventListener("click", function (e) {
      e.preventDefault();
      const event = new CustomEvent("operator", { detail: operators[i] });
      document.dispatchEvent(event);
      const originalColor = this.getAttribute("material").color;
      this.setAttribute("material", "color", "black");
      this.setAttribute("material", { opacity: 0.5, transparent: true });
      setTimeout(() => {
        this.setAttribute("material", "color", originalColor);
        this.setAttribute("material", "opacity", 1);
      }, 75);
    });
  }

  const innerDisc = document.createElement("a-entity");
  innerDisc.classList.add("raycastable", "inner-disc");
  innerDisc.setAttribute("geometry", {
    primitive: "circle",
    radius: 0.75,
    segments: 32,
  });
  innerDisc.setAttribute("material", {
    color: "#FFFFFF",
    opacity: 0,
    transparent: false,
    depthTest: false,
  });
  innerDisc.setAttribute("position", "0 0 0.1");
  innerDisc.setAttribute("click-drag");

  const targetText = document.createElement("a-text");
  targetText.setAttribute("id", "target-text");
  targetText.setAttribute("value", "");
  targetText.setAttribute("color", "#000000");
  targetText.setAttribute("align", "center");
  targetText.setAttribute("scale", "0.5 0.5 0.5");
  targetText.setAttribute("shader", "msdf");
  targetText.setAttribute("font", "https://cdn.aframe.io/fonts/Roboto-msdf.json");
  innerDisc.appendChild(targetText);

  innerDisc.addEventListener("raycaster-intersection", (e) => {
    //console.log("Raycaster Intersection", e);
  });

  interfaceEl.appendChild(innerDisc);

  interfaceEl.setAttribute("position", "1.5 1 -2"); // Startposition leicht höher setzen
  interfaceEl.setAttribute("rotation", "0 -20 0");
  document.querySelector("a-scene").appendChild(interfaceEl);

  // Mouse-basierte Double Click Detection
  let mouseClickCount = 0;
  let mouseClickTimer = null;
  const doubleClickDelay = 200; // ms

  innerDisc.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();

    mouseClickCount++;
    console.log("Mouse click count:", mouseClickCount);

    if (mouseClickCount === 1) {
      // Erster Klick - Timer starten
      mouseClickTimer = setTimeout(() => {
        // Single click Aktion - Codes löschen (nicht src)
        if (deleteEl) {
          let id = deleteEl.getAttribute("id");
          if (id.includes("src")) {
            console.log("Single click on src element - ignoring");
          } else if (!id.includes("naf")) {
            deleteEl.setAttribute("sblove_deregister", "entity", id);
            deleteEl.destroy();
            deleteEl.parentNode.removeChild(deleteEl);
          }
        }

        mouseClickCount = 0;
      }, doubleClickDelay);
    } else if (mouseClickCount === 2) {
      // Zweiter Klick innerhalb der Zeit - Double click!
      clearTimeout(mouseClickTimer);

      // Double click Aktion - Sources löschen (nur src)
      if (deleteEl) {
        let id = deleteEl.getAttribute("id");
        if (id.includes("src") && !id.includes("naf")) {
          console.log("Double Click - Delete Source Element:", id);
          deleteEl.setAttribute("sblove_deregister", "entity", id);
          deleteEl.destroy();
          deleteEl.parentNode.removeChild(deleteEl);
        } else {
          console.log("Double click on non-src element - ignoring");
        }
      }

      mouseClickCount = 0;
    }
  });
}

AFRAME.registerComponent("player-position-tracker", {
  init: function () {
    // Create HUD element
    this.hudEl = document.createElement("div");
    this.hudEl.style.position = "fixed";
    this.hudEl.style.top = "10px";
    this.hudEl.style.left = "10px";
    this.hudEl.style.color = "white";
    this.hudEl.style.fontFamily = "monospace";
    this.hudEl.style.fontSize = "16px";
    this.hudEl.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    this.hudEl.style.padding = "10px";
    this.hudEl.style.borderRadius = "5px";
    this.hudEl.style.zIndex = "9999";
    document.body.appendChild(this.hudEl);
  },
  tick: function () {
    const position = this.el.object3D.position;

    // Find all src elements
    const srcElements = document.querySelectorAll("[id^='src']");
    const srcInRange = [];

    srcElements.forEach((el) => {
      if (el.object3D) {
        const srcPos = el.object3D.getWorldPosition(new THREE.Vector3());
        const distance = position.distanceTo(srcPos);

        // Get radius from stackbeat_love component or default to 10
        const radius = sources.get(el.id)?.radius || 10;

        // Only include if player is within radius
        if (distance <= radius) {
          // Find all code elements within this src's radius
          const closestCodeElements = [];
          const codeElements = document.querySelectorAll("[id^='cod']");

          codeElements.forEach((codeEl) => {
            if (codeEl.object3D) {
              const codePos = codeEl.object3D.getWorldPosition(new THREE.Vector3());
              const codeDistance = srcPos.distanceTo(codePos);
              if (codeDistance <= radius) {
                closestCodeElements.push({
                  id: codeEl.id,
                  distance: codeDistance,
                  value: codeEl.components?.text?.attrValue?.value || "N/A",
                });
              }
            }
          });

          // Sort by distance
          closestCodeElements.sort((a, b) => a.distance - b.distance);

          // Find player's position in sequence
          let playerPositionInSequence = -1;
          for (let i = 0; i < closestCodeElements.length; i++) {
            if (distance < closestCodeElements[i].distance) {
              playerPositionInSequence = i;
              break;
            }
          }

          if (playerPositionInSequence === -1 && closestCodeElements.length > 0) {
            playerPositionInSequence = closestCodeElements.length;
          }

          if (playerPositionInSequence !== -1) {
            closestCodeElements.splice(playerPositionInSequence, 0, {
              id: "player",
              distance: distance,
              value: "?",
            });
          }

          srcInRange.push({
            id: el.id,
            distance: distance,
            radius: parseFloat(radius),
            codes: closestCodeElements,
          });
        }
      }
    });

    // Build HUD display for all src elements in range
    let hudContent = `
      X: ${position.x.toFixed(2)}<br>
      Y: ${position.y.toFixed(2)}<br>
      Z: ${position.z.toFixed(2)}<br>
      <br>
    `;

    if (srcInRange.length > 0) {
      srcInRange.forEach((src) => {
        hudContent += `
          <strong>${src.id}</strong> (dist: ${src.distance.toFixed(2)}, radius: ${src.radius.toFixed(2)})<br>
          Codes: ${src.codes.map((c) => c.value).join("")}<br>
          <br>
        `;
      });
    } else {
      hudContent += `No src elements in range<br>`;
    }

    this.hudEl.innerHTML = hudContent;
  },
  remove: function () {
    if (this.hudEl && this.hudEl.parentNode) {
      this.hudEl.parentNode.removeChild(this.hudEl);
    }
  },
});
