import * as THREE from "three";

export function makeGridTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c1220";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#1d2c48";
  g.lineWidth = 2;
  for (let i = 0; i <= 16; i++) {
    g.beginPath();
    g.moveTo((i * 512) / 16, 0);
    g.lineTo((i * 512) / 16, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, (i * 512) / 16);
    g.lineTo(512, (i * 512) / 16);
    g.stroke();
  }
  g.strokeStyle = "#3dffb044";
  g.strokeRect(2, 2, 508, 508);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildArena(scene: THREE.Scene): void {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshStandardMaterial({ map: makeGridTexture(), roughness: 0.82, metalness: 0.08 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x101828,
    roughness: 0.7,
    metalness: 0.15,
  });
  const back = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 0.35), wallMat);
  back.position.set(0, 3.1, -9.4);
  scene.add(back);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(12.4, 4.4, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x5ad0ff, emissive: 0x123848, roughness: 0.3 }),
  );
  frame.position.set(0, 2.35, -9.18);
  scene.add(frame);

  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(12, 4.1, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0a101c, roughness: 0.5 }),
  );
  pad.position.set(0, 2.35, -9.12);
  scene.add(pad);

  for (const x of [-13.6, 13.6]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 22), wallMat);
    side.position.set(x, 2.5, 0);
    scene.add(side);
  }

  const neon = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x3dffb0, emissive: 0x3dffb0, emissiveIntensity: 1.4 }),
  );
  neon.position.set(0, 5.1, -9);
  scene.add(neon);

  const sign = makeSign();
  sign.position.set(0, 5.45, -8.9);
  scene.add(sign);
}

function makeSign(): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.fillStyle = "#071018";
  g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#3dffb0";
  g.font = "bold 56px Orbitron, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("AIM 3P  LAB", 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.86),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
}

export type Operator = {
  root: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Group;
  gun: THREE.Group;
};

export function makeOperator(): Operator {
  const root = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x2a3344, roughness: 0.55, metalness: 0.2 });
  const mint = new THREE.MeshStandardMaterial({
    color: 0x3dffb0,
    emissive: 0x145c40,
    roughness: 0.35,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 0.4, metalness: 0.4 });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.22), skin);
  hips.position.y = 0.92;
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.26), skin);
  torso.position.y = 1.26;
  root.add(torso);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.27), mint);
  stripe.position.y = 1.26;
  root.add(stripe);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), skin);
  head.position.y = 1.66;
  root.add(head);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.06), mint);
  visor.position.set(0, 1.68, 0.12);
  root.add(visor);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.16), dark);
  leftLeg.position.set(-0.12, 0.36, 0);
  root.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.16), dark);
  rightLeg.position.set(0.12, 0.36, 0);
  root.add(rightLeg);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.3, 1.38, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.46, 0.12), skin);
  la.position.y = -0.16;
  leftArm.add(la);
  root.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 1.36, 0.08);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), skin);
  ra.position.set(0, -0.08, 0.1);
  ra.rotation.x = -1.1;
  rightArm.add(ra);
  root.add(rightArm);

  const gun = new THREE.Group();
  gun.position.set(0.18, 1.22, 0.28);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.46), dark);
  gun.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.28), mint);
  barrel.position.z = 0.32;
  gun.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.16), dark);
  stock.position.set(0, -0.04, -0.22);
  gun.add(stock);
  root.add(gun);

  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) m.castShadow = true;
  });

  return { root, leftLeg, rightLeg, leftArm, gun };
}
