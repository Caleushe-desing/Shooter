import * as THREE from "three";
import { playEnd, playHit, playMiss, playShot, playStart } from "./audio";
import { clamp, pick, raySphere } from "./math";
import { buildArena, makeOperator, type Operator } from "./world";

export type Mode = "grid" | "flick" | "track";

type Target = {
  mesh: THREE.Mesh;
  alive: boolean;
  cell?: number;
  vx: number;
  vy: number;
  vz: number;
};

const ROUND = 60;
const RADIUS = 0.38;
const PLAYER_SPEED = 4.4;
export const SENS = 0.00135;

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(68, 1, 0.08, 80);
  private readonly clock = new THREE.Clock();
  private readonly op: Operator;
  private readonly tracers: THREE.Line[] = [];
  private readonly sparks: { m: THREE.Mesh; life: number; v: THREE.Vector3 }[] = [];

  private yaw = 0;
  private pitch = 0.06;
  private moveX = 0;
  private moveZ = 0;
  private firing = false;
  private fireCd = 0;
  private recoil = 0;

  mode: Mode = "grid";
  playing = false;
  timeLeft = ROUND;
  score = 0;
  shots = 0;
  hits = 0;
  private combo = 0;
  private targets: Target[] = [];
  private usedCells = new Set<number>();
  private onHud: (() => void) | null = null;
  private onOver: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x070b14);
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.fog = new THREE.Fog(0x070b14, 16, 42);

    this.scene.add(new THREE.AmbientLight(0x6f88aa, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(4, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);
    const fill = new THREE.PointLight(0x3dffb0, 18, 24);
    fill.position.set(0, 4.6, -6);
    this.scene.add(fill);
    const rim = new THREE.PointLight(0x5ad0ff, 12, 20);
    rim.position.set(-4, 3, 4);
    this.scene.add(rim);

    buildArena(this.scene);
    this.op = makeOperator();
    this.op.root.position.set(0, 0, 6.2);
    this.scene.add(this.op.root);
    this.resize();
    this.placeCamera(1);
  }

  setHud(fn: () => void): void {
    this.onHud = fn;
  }
  setOver(fn: () => void): void {
    this.onOver = fn;
  }

  setMove(x: number, z: number): void {
    this.moveX = x;
    this.moveZ = z;
  }

  addLook(dx: number, dy: number): void {
    this.yaw -= dx * SENS;
    this.pitch -= dy * SENS;
    this.pitch = clamp(this.pitch, -0.85, 0.62);
  }

  setFiring(on: boolean): void {
    this.firing = on;
  }

  resize(): void {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start(mode: Mode): void {
    this.mode = mode;
    this.playing = true;
    this.timeLeft = ROUND;
    this.score = 0;
    this.shots = 0;
    this.hits = 0;
    this.combo = 0;
    this.op.root.position.set(0, 0, 6.2);
    this.yaw = 0;
    this.pitch = 0.06;
    this.clearTargets();
    if (mode === "grid") {
      this.spawnGrid(3);
    } else if (mode === "flick") {
      this.spawnFlick();
    } else {
      this.spawnTrack();
    }
    playStart();
    this.onHud?.();
  }

  stopToMenu(): void {
    this.playing = false;
    this.clearTargets();
  }

  tick(): void {
    const dt = Math.min(0.033, this.clock.getDelta());
    if (this.playing) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.playing = false;
        playEnd();
        this.onOver?.();
      }
    }
    this.stepPlayer(dt);
    this.stepTargets(dt);
    this.fireCd = Math.max(0, this.fireCd - dt);
    this.recoil = Math.max(0, this.recoil - dt * 8);
    this.placeCamera(1);
    if (this.playing && this.firing && this.fireCd <= 0) this.shoot();
    this.stepFx(dt);
    this.renderer.render(this.scene, this.camera);
    this.onHud?.();
  }

  private stepPlayer(dt: number): void {
    const s = Math.hypot(this.moveX, this.moveZ);
    const nx = s > 1 ? this.moveX / s : this.moveX;
    const nz = s > 1 ? this.moveZ / s : this.moveZ;
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const fx = -sy;
    const fz = -cy;
    const rx = cy;
    const rz = -sy;
    const p = this.op.root.position;
    p.x += (fx * -nz + rx * nx) * PLAYER_SPEED * dt;
    p.z += (fz * -nz + rz * nx) * PLAYER_SPEED * dt;
    p.x = clamp(p.x, -8.5, 8.5);
    p.z = clamp(p.z, -5.2, 9.2);
    this.op.root.rotation.y = this.yaw;

    const walk = Math.hypot(nx, nz);
    const t = performance.now() * 0.012;
    this.op.leftLeg.rotation.x = Math.sin(t) * 0.55 * walk;
    this.op.rightLeg.rotation.x = Math.sin(t + Math.PI) * 0.55 * walk;
    this.op.gun.rotation.x = -this.pitch * 0.65 - this.recoil * 0.15;
    this.op.leftArm.rotation.x = -0.4 - this.pitch * 0.3;
  }

  private placeCamera(alpha: number): void {
    const p = this.op.root.position;
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    const back = 3.15;
    const side = 0.72;
    const lift = 1.62 + this.recoil * 0.04;
    const ideal = new THREE.Vector3(
      p.x + sy * back + cy * side,
      p.y + lift,
      p.z + cy * back - sy * side,
    );
    this.camera.position.lerp(ideal, alpha);
    const lookDist = 14;
    const look = new THREE.Vector3(
      p.x - sy * lookDist,
      p.y + 1.55 + Math.sin(this.pitch) * lookDist,
      p.z - cy * lookDist,
    );
    this.camera.lookAt(look);
  }

  private shoot(): void {
    this.fireCd = this.mode === "track" ? 0.07 : 0.11;
    this.recoil = 1;
    this.shots += 1;
    playShot();

    const origin = new THREE.Vector3();
    const dir = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(dir);
    this.spawnTracer(origin, origin.clone().addScaledVector(dir, 22));

    let best: Target | null = null;
    let bestT = 1e9;
    for (const t of this.targets) {
      if (!t.alive) continue;
      const hit = raySphere(origin, dir, t.mesh.position, RADIUS + 0.18);
      if (hit !== null && hit < bestT) {
        bestT = hit;
        best = t;
      }
    }
    if (best) {
      this.registerHit(best);
    } else {
      this.combo = 0;
      playMiss();
    }
  }

  private registerHit(t: Target): void {
    this.hits += 1;
    this.combo += 1;
    const bonus = this.mode === "track" ? 12 : 100 + this.combo * 8;
    this.score += bonus;
    playHit();
    this.burst(t.mesh.position);
    if (this.mode === "track") return;
    t.alive = false;
    t.mesh.visible = false;
    this.scene.remove(t.mesh);
    if (t.cell !== undefined) this.usedCells.delete(t.cell);
    if (this.mode === "grid") this.spawnGrid(1);
    else this.spawnFlick();
  }

  private stepTargets(dt: number): void {
    if (this.mode !== "track") return;
    for (const t of this.targets) {
      if (!t.alive) continue;
      t.mesh.position.x += t.vx * dt;
      t.mesh.position.y += t.vy * dt;
      t.mesh.position.z += t.vz * dt;
      if (t.mesh.position.x < -5 || t.mesh.position.x > 5) t.vx *= -1;
      if (t.mesh.position.y < 1.1 || t.mesh.position.y > 3.6) t.vy *= -1;
      if (t.mesh.position.z < -8.4 || t.mesh.position.z > -3.2) t.vz *= -1;
      t.mesh.position.x = clamp(t.mesh.position.x, -5, 5);
      t.mesh.position.y = clamp(t.mesh.position.y, 1.1, 3.6);
      t.mesh.position.z = clamp(t.mesh.position.z, -8.4, -3.2);
    }
  }

  private cellPos(i: number): THREE.Vector3 {
    const col = i % 5;
    const row = (i / 5) | 0;
    return new THREE.Vector3(-2.4 + col * 1.2, 1.25 + row * 1.05, -8.85);
  }

  private spawnGrid(n: number): void {
    for (let k = 0; k < n; k++) {
      const free = [];
      for (let i = 0; i < 15; i++) if (!this.usedCells.has(i)) free.push(i);
      if (!free.length) return;
      const cell = pick(free);
      this.usedCells.add(cell);
      this.addTarget(this.cellPos(cell), cell);
    }
  }

  private spawnFlick(): void {
    const last = this.targets.find((t) => !t.alive)?.cell ?? 7;
    const opts = [];
    for (let i = 0; i < 15; i++) {
      const a = this.cellPos(last);
      const b = this.cellPos(i);
      if (a.distanceTo(b) > 1.8) opts.push(i);
    }
    const cell = pick(opts.length ? opts : [0, 4, 10, 14]);
    this.addTarget(this.cellPos(cell), cell);
  }

  private spawnTrack(): void {
    const t = this.addTarget(new THREE.Vector3(0, 2.2, -6.5));
    t.vx = 2.1;
    t.vy = 1.3;
    t.vz = 1.1;
  }

  private addTarget(pos: THREE.Vector3, cell?: number): Target {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff4d6d,
      emissive: 0xff4d6d,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 24, 16), mat);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const t: Target = { mesh, alive: true, cell, vx: 0, vy: 0, vz: 0 };
    this.targets.push(t);
    return t;
  }

  private clearTargets(): void {
    for (const t of this.targets) this.scene.remove(t.mesh);
    this.targets = [];
    this.usedCells.clear();
  }

  private spawnTracer(a: THREE.Vector3, b: THREE.Vector3): void {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0x5ad0ff, transparent: true, opacity: 0.7 }),
    );
    this.scene.add(line);
    this.tracers.push(line);
  }

  private burst(p: THREE.Vector3): void {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x3dffb0 }),
      );
      m.position.copy(p);
      this.scene.add(m);
      this.sparks.push({
        m,
        life: 0.35,
        v: new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6),
      });
    }
  }

  private stepFx(dt: number): void {
    for (const line of this.tracers.splice(0)) {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.m.position.addScaledVector(s.v, dt);
      s.v.y -= 8 * dt;
      if (s.life <= 0) {
        this.scene.remove(s.m);
        this.sparks.splice(i, 1);
      }
    }
  }

  accuracy(): number {
    if (!this.shots) return 100;
    return Math.round((this.hits / this.shots) * 100);
  }
}
