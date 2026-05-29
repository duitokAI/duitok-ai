import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
      .then((buffer) => {
        this.result = buffer;
        this.onloadend?.({ target: this });
        this.onload?.({ target: this });
      })
      .catch((error) => {
        this.error = error;
        this.onerror?.(error);
      });
  }
};

const outputDir = path.join(process.cwd(), "public/models/agent");
const outputPath = path.join(outputDir, "pokaya-agent.glb");

const colors = {
  purple: 0x5d086c,
  purpleDark: 0x2a0d32,
  screen: 0x15071a,
  pink: 0xff4f78,
  coral: 0xff8766,
  gold: 0xf4ca32,
  mint: 0x4fd1b4,
  blue: 0x62a8ff,
  white: 0xffffff,
  soft: 0xffeef6
};

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.03,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function roundedBox(name, size, color, radius = 0.08) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(size[0], size[1], size[2], 5, radius),
    mat(color)
  );
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function capsule(name, radius, length, color) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 12, 24), mat(color));
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(name, radius, depth, color) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), mat(color));
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeAgent() {
  const root = new THREE.Group();
  root.name = "PokayaAgent";

  const body = roundedBox("body", [1.05, 1.15, 0.62], colors.purple, 0.18);
  body.position.y = 1.25;
  root.add(body);

  const screen = roundedBox("screen_face", [0.78, 0.58, 0.035], colors.screen, 0.08);
  screen.material.emissive.setHex(colors.screen);
  screen.material.emissiveIntensity = 0.18;
  screen.position.set(0, 1.33, 0.335);
  root.add(screen);

  const eyeLeft = roundedBox("eye_left", [0.14, 0.08, 0.025], colors.pink, 0.03);
  eyeLeft.material.emissive.setHex(colors.pink);
  eyeLeft.material.emissiveIntensity = 1.15;
  eyeLeft.position.set(-0.18, 1.39, 0.365);
  const eyeRight = eyeLeft.clone();
  eyeRight.name = "eye_right";
  eyeRight.position.x = 0.18;
  root.add(eyeLeft, eyeRight);

  const smile = roundedBox("smile", [0.28, 0.04, 0.025], colors.gold, 0.02);
  smile.material.emissive.setHex(colors.gold);
  smile.material.emissiveIntensity = 0.75;
  smile.position.set(0, 1.22, 0.365);
  root.add(smile);

  const headGlow = cylinder("ai_light", 0.09, 0.08, colors.pink);
  headGlow.material.emissive.setHex(colors.pink);
  headGlow.material.emissiveIntensity = 0.9;
  headGlow.position.set(0.34, 1.95, 0.02);
  root.add(headGlow);

  const antenna = cylinder("antenna", 0.025, 0.42, colors.gold);
  antenna.position.set(0.24, 1.78, 0.02);
  antenna.rotation.z = -0.45;
  root.add(antenna);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.name = "left_arm_pivot";
  leftArmPivot.position.set(-0.62, 1.44, 0.02);
  const leftArm = capsule("left_arm", 0.085, 0.46, colors.pink);
  leftArm.position.y = -0.3;
  leftArm.rotation.z = 0.08;
  leftArmPivot.add(leftArm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.name = "right_arm_pivot";
  rightArmPivot.position.set(0.62, 1.44, 0.02);
  const rightArm = capsule("right_arm", 0.085, 0.46, colors.pink);
  rightArm.position.y = -0.3;
  rightArm.rotation.z = -0.08;
  rightArmPivot.add(rightArm);
  root.add(leftArmPivot, rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.name = "left_leg_pivot";
  leftLegPivot.position.set(-0.26, 0.72, 0.02);
  const leftLeg = capsule("left_leg", 0.1, 0.38, colors.purpleDark);
  leftLeg.position.y = -0.28;
  leftLegPivot.add(leftLeg);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.name = "right_leg_pivot";
  rightLegPivot.position.set(0.26, 0.72, 0.02);
  const rightLeg = capsule("right_leg", 0.1, 0.38, colors.purpleDark);
  rightLeg.position.y = -0.28;
  rightLegPivot.add(rightLeg);
  root.add(leftLegPivot, rightLegPivot);

  const chest = roundedBox("pokaya_ai_badge", [0.38, 0.16, 0.03], colors.white, 0.035);
  chest.position.set(0, 0.92, 0.34);
  root.add(chest);

  const workTablet = roundedBox("work_tablet", [0.58, 0.38, 0.035], colors.blue, 0.05);
  workTablet.name = "work_tablet";
  workTablet.material.emissive.setHex(colors.blue);
  workTablet.material.emissiveIntensity = 0.32;
  workTablet.position.set(0.72, 1.12, 0.48);
  workTablet.rotation.y = -0.28;
  root.add(workTablet);

  root.userData.animationTargets = {
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    body,
    screen,
    eyeLeft,
    eyeRight,
    smile,
    workTablet
  };
  return root;
}

function vecTrack(node, prop, times, values) {
  return new THREE.VectorKeyframeTrack(`${node.name}.${prop}`, times, values);
}

function quatTrack(node, times, eulers) {
  const values = [];
  for (const euler of eulers) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler));
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${node.name}.quaternion`, times, values);
}

function clip(name, duration, tracks) {
  return new THREE.AnimationClip(name, duration, tracks);
}

function makeClips(agent) {
  const t = agent.userData.animationTargets;
  const loopTimes = [0, 0.5, 1];
  const walkTimes = [0, 0.25, 0.5, 0.75, 1];

  return [
    clip("idle_stand", 1, [
      vecTrack(agent, "position", loopTimes, [0, 0, 0, 0, 0.045, 0, 0, 0, 0]),
      quatTrack(t.leftArmPivot, loopTimes, [[0, 0, 0.12], [0.08, 0, 0.2], [0, 0, 0.12]]),
      quatTrack(t.rightArmPivot, loopTimes, [[0, 0, -0.12], [-0.08, 0, -0.2], [0, 0, -0.12]])
    ]),
    clip("idle_sleep", 1.4, [
      quatTrack(agent, [0, 0.7, 1.4], [[0, 0, Math.PI / 2.4], [0, 0.08, Math.PI / 2.4], [0, 0, Math.PI / 2.4]]),
      vecTrack(agent, "position", [0, 0.7, 1.4], [-0.1, -0.12, 0, -0.1, -0.08, 0, -0.1, -0.12, 0])
    ]),
    clip("idle_run", 0.72, [
      quatTrack(t.leftLegPivot, walkTimes, [[0.55, 0, 0], [-0.35, 0, 0], [0.55, 0, 0], [-0.35, 0, 0], [0.55, 0, 0]]),
      quatTrack(t.rightLegPivot, walkTimes, [[-0.35, 0, 0], [0.55, 0, 0], [-0.35, 0, 0], [0.55, 0, 0], [-0.35, 0, 0]]),
      vecTrack(agent, "position", walkTimes, [0, 0, 0, 0, 0.06, 0, 0, 0, 0, 0, 0.06, 0, 0, 0, 0])
    ]),
    clip("walk", 0.9, [
      quatTrack(t.leftLegPivot, walkTimes, [[0.38, 0, 0], [-0.38, 0, 0], [0.38, 0, 0], [-0.38, 0, 0], [0.38, 0, 0]]),
      quatTrack(t.rightLegPivot, walkTimes, [[-0.38, 0, 0], [0.38, 0, 0], [-0.38, 0, 0], [0.38, 0, 0], [-0.38, 0, 0]]),
      quatTrack(t.leftArmPivot, walkTimes, [[-0.18, 0, 0.12], [0.18, 0, 0.2], [-0.18, 0, 0.12], [0.18, 0, 0.2], [-0.18, 0, 0.12]]),
      quatTrack(t.rightArmPivot, walkTimes, [[0.18, 0, -0.12], [-0.18, 0, -0.2], [0.18, 0, -0.12], [-0.18, 0, -0.2], [0.18, 0, -0.12]])
    ]),
    clip("work_typing", 0.72, [
      quatTrack(t.leftArmPivot, walkTimes, [[-0.72, 0, 0.24], [-0.5, 0, 0.18], [-0.72, 0, 0.24], [-0.5, 0, 0.18], [-0.72, 0, 0.24]]),
      quatTrack(t.rightArmPivot, walkTimes, [[-0.5, 0, -0.22], [-0.72, 0, -0.18], [-0.5, 0, -0.22], [-0.72, 0, -0.18], [-0.5, 0, -0.22]])
    ]),
    clip("work_image", 1.1, [
      quatTrack(t.rightArmPivot, [0, 0.35, 0.7, 1.1], [[-0.2, 0, -0.2], [-1.05, 0, -0.65], [-0.4, 0, -0.4], [-0.2, 0, -0.2]]),
      quatTrack(t.leftArmPivot, [0, 0.55, 1.1], [[-0.35, 0, 0.28], [-0.55, 0, 0.34], [-0.35, 0, 0.28]])
    ]),
    clip("work_video", 1.2, [
      quatTrack(t.leftArmPivot, [0, 0.4, 0.8, 1.2], [[-0.48, 0, 0.12], [-0.25, 0, 0.5], [-0.62, 0, 0.2], [-0.48, 0, 0.12]]),
      quatTrack(t.rightArmPivot, [0, 0.4, 0.8, 1.2], [[-0.38, 0, -0.18], [-0.66, 0, -0.46], [-0.28, 0, -0.2], [-0.38, 0, -0.18]]),
      vecTrack(t.workTablet, "scale", [0, 0.6, 1.2], [1, 1, 1, 1.1, 1.1, 1.1, 1, 1, 1])
    ]),
    clip("thinking", 1.1, [
      quatTrack(agent, [0, 0.55, 1.1], [[0, 0.18, 0], [0, -0.18, 0], [0, 0.18, 0]]),
      vecTrack(t.eyeLeft, "scale", [0, 0.55, 1.1], [1, 1, 1, 1.22, 1, 1, 1, 1, 1]),
      vecTrack(t.eyeRight, "scale", [0, 0.55, 1.1], [1, 1, 1, 1.22, 1, 1, 1, 1, 1])
    ]),
    clip("success", 0.9, [
      vecTrack(agent, "position", [0, 0.32, 0.55, 0.9], [0, 0, 0, 0, 0.36, 0, 0, 0.1, 0, 0, 0, 0]),
      quatTrack(t.leftArmPivot, [0, 0.45, 0.9], [[-0.2, 0, 0.15], [-1.6, 0, 0.65], [-0.2, 0, 0.15]]),
      quatTrack(t.rightArmPivot, [0, 0.45, 0.9], [[-0.2, 0, -0.15], [-1.6, 0, -0.65], [-0.2, 0, -0.15]])
    ])
  ];
}

async function exportGlb(root, animations) {
  const exporter = new GLTFExporter();
  const result = await new Promise((resolve, reject) => {
    exporter.parse(
      root,
      resolve,
      reject,
      {
        binary: true,
        animations,
        onlyVisible: false,
        trs: false
      }
    );
  });
  return Buffer.from(result);
}

fs.mkdirSync(outputDir, { recursive: true });
const scene = new THREE.Scene();
scene.name = "PokayaAgentScene";
const agent = makeAgent();
scene.add(agent);
const animations = makeClips(agent);
const buffer = await exportGlb(scene, animations);
fs.writeFileSync(outputPath, buffer);

console.log(JSON.stringify({
  output: outputPath,
  bytes: buffer.byteLength,
  mb: Number((buffer.byteLength / 1024 / 1024).toFixed(3)),
  animations: animations.map((item) => item.name)
}, null, 2));
