import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const modes = new Set(["idle", "image", "video", "copy", "schedule", "command"]);
let currentScene = null;

const palette = {
  purple: 0x5d086c,
  deep: 0x18091d,
  pink: 0xff4f78,
  coral: 0xff8766,
  gold: 0xf4ca32,
  mint: 0x4fd1b4,
  blue: 0x62a8ff,
  paper: 0xfffbf6,
  floor: 0xf3edf5
};

const productionAnimationMap = {
  idle: ["idle_stand", "idle_sleep", "idle_run", "Idle", "idle"],
  image: ["work_image", "walk", "work_typing", "Image", "image"],
  video: ["work_video", "walk", "work_typing", "Video", "video"],
  copy: ["work_typing", "thinking", "Copy", "copy"],
  schedule: ["work_typing", "thinking", "Schedule", "schedule"],
  command: ["thinking", "work_typing", "Command", "command"]
};

function box(w, h, d, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.72,
      metalness: options.metalness ?? 0.02,
      transparent: Boolean(options.opacity),
      opacity: options.opacity ?? 1
    })
  );
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  return mesh;
}

function cylinder(radius, depth, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, options.segments || 32),
    new THREE.MeshStandardMaterial({
      color,
      roughness: options.roughness ?? 0.65,
      metalness: options.metalness ?? 0.03
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function textTexture(text, bg = "#ffffff", fg = "#5d086c") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.font = "800 42px Inter, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  wrapText(ctx, text, 38, 90, 440, 48);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(/\s+/);
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineIndex * lineHeight);
      line = word;
      lineIndex += 1;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y + lineIndex * lineHeight);
}

function labelPlane(text, bg, fg) {
  const texture = textTexture(text, bg, fg);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.66), material);
  mesh.userData.texture = texture;
  return mesh;
}

function setPrototypeVisible(data, visible) {
  if (data.mascot) data.mascot.visible = visible;
}

function pickClip(clips, mode) {
  const names = productionAnimationMap[mode] || productionAnimationMap.idle;
  return names.map((name) => clips.find((clip) => clip.name === name || clip.name.toLowerCase() === name.toLowerCase())).find(Boolean);
}

function playProductionAnimation(data, mode) {
  if (!data.modelMixer || !data.modelClips?.length) return;
  const clip = pickClip(data.modelClips, mode);
  if (!clip || data.activeClipName === clip.name) return;
  const next = data.modelMixer.clipAction(clip);
  next.enabled = true;
  next.reset();
  next.fadeIn(0.18);
  next.play();
  if (data.activeAction) data.activeAction.fadeOut(0.18);
  data.activeAction = next;
  data.activeClipName = clip.name;
}

function normalizeProductionModel(object) {
  const box3 = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box3.getSize(size);
  box3.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  object.scale.multiplyScalar(2.42 / maxAxis);
  object.position.sub(center.multiplyScalar(object.scale.x));
  object.position.y += 1.02;
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) child.material.needsUpdate = true;
    }
  });
}

function loadProductionModel(data, options) {
  if (!options.modelUrl) return;
  fetch(options.modelUrl, { method: "HEAD" })
    .then((res) => {
      if (!res.ok || currentScene !== data) throw new Error("Production model unavailable");
      const loader = new GLTFLoader();
      loader.load(
        options.modelUrl,
        (gltf) => {
          if (currentScene !== data) return;
      data.productionRoot = gltf.scene;
          data.modelClips = gltf.animations || [];
          data.modelMixer = data.modelClips.length ? new THREE.AnimationMixer(data.productionRoot) : null;
      normalizeProductionModel(data.productionRoot);
      data.productionRoot.position.x = data.mode === "idle" ? -1.85 : -0.72;
      data.productionRoot.position.z = data.mode === "idle" ? 0.95 : -0.35;
      data.productionRoot.rotation.y = data.mode === "idle" ? 0.16 : -0.22;
      data.root.add(data.productionRoot);
          setPrototypeVisible(data, false);
          playProductionAnimation(data, data.mode);
          data.el.closest(".agent-3d-card")?.classList.add("agent-3d-card--production");
        },
        undefined,
        () => {
          data.el.closest(".agent-3d-card")?.classList.add("agent-3d-card--prototype");
        }
      );
    })
    .catch(() => {
      data.el.closest(".agent-3d-card")?.classList.add("agent-3d-card--prototype");
    });
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
    if (child.userData?.texture) child.userData.texture.dispose();
  });
}

function makeMascot(url) {
  const group = new THREE.Group();
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  const body = box(0.72, 0.68, 0.44, palette.purple, { roughness: 0.52 });
  body.position.set(0, 0, 0);
  group.add(body);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.86),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false })
  );
  face.position.set(0, 0.03, 0.24);
  group.add(face);

  const leftArm = box(0.13, 0.44, 0.13, palette.pink);
  leftArm.position.set(-0.48, -0.05, 0.04);
  leftArm.rotation.z = -0.42;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.48;
  rightArm.rotation.z = 0.42;
  group.add(leftArm, rightArm);

  const leftLeg = box(0.14, 0.38, 0.14, 0x2a1530);
  leftLeg.position.set(-0.22, -0.52, 0.05);
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.22;
  group.add(leftLeg, rightLeg);

  const antenna = cylinder(0.025, 0.42, palette.gold);
  antenna.position.set(0.24, 0.54, 0.02);
  antenna.rotation.z = -0.45;
  const bulb = cylinder(0.08, 0.08, palette.pink);
  bulb.position.set(0.38, 0.72, 0.02);
  group.add(antenna, bulb);

  group.userData.leftLeg = leftLeg;
  group.userData.rightLeg = rightLeg;
  group.userData.leftArm = leftArm;
  group.userData.rightArm = rightArm;
  group.scale.set(1.42, 1.42, 1.42);
  return group;
}

function makeRoom() {
  const group = new THREE.Group();
  const floor = box(7.2, 0.12, 5.2, palette.floor, { castShadow: false });
  floor.position.set(0, -0.08, 0);
  group.add(floor);

  const back = box(7.2, 2.6, 0.12, 0xf8f0fa, { castShadow: false });
  back.position.set(0, 1.24, -2.6);
  group.add(back);

  const side = box(0.12, 2.6, 5.2, 0xfbf6ff, { castShadow: false });
  side.position.set(-3.6, 1.24, 0);
  group.add(side);

  const rug = box(2.6, 0.05, 1.52, 0xffedf3, { castShadow: false });
  rug.position.set(-1.3, 0.03, 0.95);
  group.add(rug);
  return group;
}

function makeIdleSet() {
  const group = new THREE.Group();
  const bed = box(2.1, 0.38, 1.15, 0xffffff);
  bed.position.set(-1.95, 0.24, 0.95);
  group.add(bed);

  const blanket = box(1.45, 0.12, 1, palette.purple);
  blanket.position.set(-2.12, 0.53, 0.98);
  group.add(blanket);

  const pillow = box(0.52, 0.18, 0.74, 0xffdce8);
  pillow.position.set(-1.18, 0.62, 0.98);
  group.add(pillow);

  const track = box(1.34, 0.1, 0.8, 0x2b2030);
  track.position.set(1.58, 0.22, 1.06);
  group.add(track);

  const handle = box(0.1, 1, 0.1, palette.purple);
  handle.position.set(2.12, 0.75, 0.72);
  group.add(handle);
  const rail = box(0.82, 0.08, 0.08, palette.purple);
  rail.position.set(1.74, 1.2, 0.72);
  group.add(rail);

  const plantStem = cylinder(0.035, 0.7, 0x3a7d55);
  plantStem.position.set(2.86, 0.45, -1.65);
  group.add(plantStem);
  const leaf = cylinder(0.26, 0.12, 0x6ccf8d, { segments: 18 });
  leaf.rotation.x = Math.PI / 2;
  leaf.position.set(2.86, 0.86, -1.65);
  group.add(leaf);
  return group;
}

function makeWorkSet() {
  const group = new THREE.Group();
  const desk = box(2.72, 0.18, 1.18, 0xffffff);
  desk.position.set(0.75, 0.72, -0.65);
  group.add(desk);

  const legA = box(0.12, 0.72, 0.12, 0x7b6484);
  legA.position.set(-0.48, 0.35, -0.12);
  group.add(legA, legA.clone());
  group.children.at(-1).position.set(1.98, 0.35, -1.16);

  const monitor = box(1.42, 0.86, 0.1, palette.deep, { roughness: 0.48 });
  monitor.position.set(0.76, 1.32, -1.14);
  group.add(monitor);

  const screen = box(1.18, 0.62, 0.04, palette.purple, { opacity: 0.92, castShadow: false });
  screen.position.set(0.76, 1.34, -1.2);
  group.add(screen);

  const keyboard = box(1.14, 0.05, 0.32, 0xf4edf5);
  keyboard.position.set(0.55, 0.86, -0.34);
  group.add(keyboard);

  const phone = box(0.38, 0.05, 0.64, palette.deep);
  phone.rotation.y = -0.2;
  phone.position.set(1.58, 0.88, -0.28);
  group.add(phone);

  const parcel = box(0.58, 0.36, 0.48, 0xe8b77c);
  parcel.position.set(-0.54, 0.95, -0.48);
  group.add(parcel);

  const progress = box(0.18, 0.05, 0.04, palette.gold, { castShadow: false });
  progress.position.set(0.28, 1.1, -1.24);
  progress.userData.role = "progress";
  group.add(progress);

  return group;
}

function makeCards() {
  const group = new THREE.Group();
  const positions = [
    [-1.92, 1.55, -1.58],
    [2.46, 1.56, -1.48],
    [2.28, 0.98, 0.12]
  ];
  for (const [index, position] of positions.entries()) {
    const card = labelPlane(["Hook", "Asset", "Post"][index], "#fff7fb", "#5d086c");
    card.position.set(...position);
    card.rotation.y = index === 0 ? 0.22 : -0.28;
    card.userData.floatSpeed = 0.8 + index * 0.18;
    card.userData.baseY = position[1];
    group.add(card);
  }
  return group;
}

function makeModeProps() {
  const group = new THREE.Group();

  const image = new THREE.Group();
  image.userData.mode = "image";
  const canvas = box(0.76, 0.56, 0.04, 0xfff1f7);
  canvas.position.set(-0.95, 1.34, -1.2);
  const paletteTray = box(0.54, 0.08, 0.28, palette.pink);
  paletteTray.position.set(-0.86, 0.92, -0.34);
  const swatchA = cylinder(0.09, 0.04, palette.gold);
  swatchA.position.set(-1.08, 0.99, -0.28);
  const swatchB = cylinder(0.09, 0.04, palette.mint);
  swatchB.position.set(-0.86, 0.99, -0.28);
  image.add(canvas, paletteTray, swatchA, swatchB);

  const video = new THREE.Group();
  video.userData.mode = "video";
  const cameraBody = box(0.46, 0.3, 0.24, 0x1e1424);
  cameraBody.position.set(-0.86, 1.08, -0.34);
  const lens = cylinder(0.13, 0.22, palette.blue);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(-0.86, 1.08, -0.12);
  const timeline = box(1.04, 0.08, 0.24, 0x2d1836);
  timeline.position.set(0.42, 0.93, -0.22);
  const clipA = box(0.28, 0.09, 0.26, palette.pink);
  clipA.position.set(0.04, 1, -0.22);
  const clipB = box(0.32, 0.09, 0.26, palette.gold);
  clipB.position.set(0.48, 1, -0.22);
  video.add(cameraBody, lens, timeline, clipA, clipB);

  const copy = new THREE.Group();
  copy.userData.mode = "copy";
  const notebook = box(0.78, 0.08, 0.58, 0xffffff);
  notebook.rotation.y = -0.18;
  notebook.position.set(-0.68, 0.92, -0.32);
  const pen = box(0.58, 0.04, 0.04, palette.gold);
  pen.rotation.y = 0.62;
  pen.position.set(-0.62, 1.02, -0.24);
  copy.add(notebook, pen);

  const schedule = new THREE.Group();
  schedule.userData.mode = "schedule";
  const calendar = box(0.9, 0.64, 0.05, 0xffffff);
  calendar.position.set(-0.96, 1.34, -1.2);
  const header = box(0.9, 0.14, 0.06, palette.blue);
  header.position.set(-0.96, 1.59, -1.24);
  const marker = box(0.22, 0.14, 0.07, palette.pink);
  marker.position.set(-1.18, 1.3, -1.25);
  schedule.add(calendar, header, marker);

  const command = new THREE.Group();
  command.userData.mode = "command";
  const consoleBase = box(0.9, 0.18, 0.46, 0x25112c);
  consoleBase.position.set(-0.66, 0.96, -0.36);
  const pulse = cylinder(0.2, 0.08, palette.coral);
  pulse.position.set(-0.66, 1.12, -0.36);
  command.add(consoleBase, pulse);

  group.add(image, video, copy, schedule, command);
  return group;
}

function setMode(scene, mode, copy = {}) {
  const nextMode = modes.has(mode) ? mode : "idle";
  scene.mode = nextMode;
  if (scene.productionRoot) {
    scene.productionRoot.position.x = nextMode === "idle" ? -1.85 : -0.72;
    scene.productionRoot.position.z = nextMode === "idle" ? 0.95 : -0.35;
    scene.productionRoot.rotation.y = nextMode === "idle" ? 0.16 : -0.22;
    playProductionAnimation(scene, nextMode);
    return;
  }
  scene.idleGroup.visible = nextMode === "idle";
  scene.workGroup.visible = nextMode !== "idle";
  scene.cards.visible = nextMode !== "idle";
  scene.modeProps.children.forEach((item) => {
    item.visible = item.userData.mode === nextMode;
  });

  const colors = {
    idle: palette.mint,
    image: palette.pink,
    video: palette.purple,
    copy: palette.gold,
    schedule: palette.blue,
    command: palette.coral
  };

  scene.workGroup.traverse((item) => {
    if (item.userData.role === "progress") item.material.color.setHex(colors[nextMode]);
  });

  scene.mascot.position.set(nextMode === "idle" ? -1.98 : -0.7, nextMode === "idle" ? 1.1 : 1.28, nextMode === "idle" ? 1.14 : -0.28);
  scene.mascot.scale.set(nextMode === "idle" ? 1.22 : 1.44, nextMode === "idle" ? 1.22 : 1.44, 1);
  scene.mascot.rotation.y = nextMode === "idle" ? 0.18 : -0.1;

  const labels = copy.cards?.length ? copy.cards : ["Reading task", "Making asset", "Ready to review"];
  scene.cards.children.forEach((card, index) => {
    card.material.map.dispose();
    card.userData.texture?.dispose();
    const texture = textTexture(labels[index] || labels[0], "#fff7fb", "#5d086c");
    card.material.map = texture;
    card.userData.texture = texture;
    card.material.needsUpdate = true;
  });
}

function createAgentScene(el, options) {
  const scene = new THREE.Scene();
  scene.background = null;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  el.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-3.9, 3.9, 2.85, -2.85, 0.1, 100);
  camera.position.set(4.9, 4.2, 5.3);
  camera.lookAt(0, 0.55, 0);

  const root = new THREE.Group();
  root.rotation.y = -0.16;
  scene.add(root);
  root.add(makeRoom());

  const idleGroup = makeIdleSet();
  const workGroup = makeWorkSet();
  const cards = makeCards();
  const modeProps = makeModeProps();
  const mascot = makeMascot(options.mascotUrl);
  root.add(idleGroup, workGroup, cards, modeProps, mascot);

  const ambient = new THREE.HemisphereLight(0xffffff, 0xb48ac2, 2.2);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(1.8, 5, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const data = {
    el,
    scene,
    renderer,
    camera,
    root,
    mascot,
    idleGroup,
    workGroup,
    cards,
    modeProps,
    frame: 0,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    resizeObserver: null,
    mode: "idle",
    productionRoot: null,
    modelMixer: null,
    modelClips: [],
    activeAction: null,
    activeClipName: ""
  };

  data.resizeObserver = new ResizeObserver(() => resize(data));
  data.resizeObserver.observe(el);
  resize(data);
  setMode(data, options.mode, options);
  loadProductionModel(data, options);
  animate(data);
  return data;
}

function resize(data) {
  const rect = data.el.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(260, Math.floor(rect.height));
  data.renderer.setSize(width, height, false);
  const aspect = width / height;
  data.camera.left = -3.1 * aspect;
  data.camera.right = 3.1 * aspect;
  data.camera.top = 2.95;
  data.camera.bottom = -2.15;
  data.camera.updateProjectionMatrix();
}

function animate(data) {
  const clockStart = performance.now();
  const tick = () => {
    const time = (performance.now() - clockStart) / 1000;
    if (!data.reducedMotion) {
      data.mascot.position.y += Math.sin(time * 2.2) * 0.0016;
      data.root.rotation.y = -0.16 + Math.sin(time * 0.32) * 0.025;
      const walk = data.mode === "idle" ? 0.08 : 0.38;
      data.mascot.userData.leftLeg.rotation.x = Math.sin(time * 5.2) * walk;
      data.mascot.userData.rightLeg.rotation.x = -Math.sin(time * 5.2) * walk;
      data.mascot.userData.leftArm.rotation.z = -0.42 + Math.sin(time * 4.2) * walk * 0.34;
      data.mascot.userData.rightArm.rotation.z = 0.42 - Math.sin(time * 4.2) * walk * 0.34;
      data.cards.children.forEach((card) => {
        card.position.y = card.userData.baseY + Math.sin(time * card.userData.floatSpeed) * 0.045;
      });
      data.workGroup.traverse((item) => {
        if (item.userData.role === "progress") {
          item.scale.x = 1 + Math.abs(Math.sin(time * 2.4)) * 5.2;
        }
      });
      if (data.productionRoot) {
        data.productionRoot.rotation.y = (data.mode === "idle" ? 0.16 : -0.22) + Math.sin(time * 0.55) * 0.04;
      }
    }
    if (data.modelMixer) data.modelMixer.update(1 / 60);
    data.renderer.render(data.scene, data.camera);
    data.frame = requestAnimationFrame(tick);
  };
  tick();
}

export function mountAgent3D(el, options = {}) {
  if (!el) return;
  const mode = modes.has(options.mode) ? options.mode : "idle";
  if (currentScene?.el === el) {
    setMode(currentScene, mode, options);
    resize(currentScene);
    return;
  }
  disposeAgent3D();
  currentScene = createAgentScene(el, { ...options, mode });
}

export function disposeAgent3D() {
  if (!currentScene) return;
  cancelAnimationFrame(currentScene.frame);
  currentScene.resizeObserver?.disconnect();
  disposeObject(currentScene.scene);
  currentScene.renderer.dispose();
  currentScene.renderer.domElement.remove();
  currentScene = null;
}
