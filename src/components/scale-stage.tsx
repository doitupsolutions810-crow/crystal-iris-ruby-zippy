import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  levelHeight,
  levelRadius,
  MAX_LEVEL,
  PHI_INV,
  PHI_INV2,
  sampleScale,
  walkStar,
  type ScaleSample,
} from "@/lib/scale-math";

export type ViewId = "watch" | "observer" | "forward" | "adjacent" | "down";

export type Layers = {
  orbit: boolean;
  heat: boolean;
  nine: boolean;
  cylinder: boolean;
  residual: boolean;
};

const INK = 0x12110e;
const PAPER = 0xefe8d8;
const GOLD = 0xd4a054;
const MUTED = 0x8f8778;

type Props = {
  running: boolean;
  rate: number;
  probe: number;
  view: ViewId;
  layers: Layers;
  resetToken: number;
  onSample: (sample: ScaleSample) => void;
};

function makeLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (!g) {
    return new THREE.Sprite();
  }
  g.clearRect(0, 0, 256, 128);
  g.fillStyle = color;
  g.font = "500 64px 'IBM Plex Mono', monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.62, 0.31, 1);
  return sprite;
}

function line(points: number[], color: number, opacity: number): THREE.LineSegments {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.LineSegments(geo, mat);
}

export function ScaleStage({ running, rate, probe, view, layers, resetToken, onSample }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const runningRef = useRef(running);
  const rateRef = useRef(rate);
  const probeRef = useRef(probe);
  const viewRef = useRef(view);
  const layersRef = useRef(layers);
  const resetRef = useRef(resetToken);
  const onSampleRef = useRef(onSample);
  runningRef.current = running;
  rateRef.current = rate;
  probeRef.current = probe;
  viewRef.current = view;
  layersRef.current = layers;
  resetRef.current = resetToken;
  onSampleRef.current = onSample;

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(INK, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(INK, 14, 28);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
    camera.position.set(5.4, 3.1, 6.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.15, 0);
    controls.maxDistance = 18;
    controls.minDistance = 1.2;

    scene.add(new THREE.AmbientLight(0x8a8070, 0.55));
    const key = new THREE.DirectionalLight(0xffe2b0, 1.35);
    key.position.set(4, 8, 3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899aa, 0.35);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const grid = new THREE.GridHelper(12, 24, 0x3a3428, 0x2a261e);
    grid.position.y = 0;
    scene.add(grid);

    const stars: THREE.LineSegments[] = [];
    const cones: THREE.LineSegments[] = [];
    for (let n = 0; n <= MAX_LEVEL; n += 1) {
      const radius = levelRadius(n);
      const y = levelHeight(n);
      const spin = n * (Math.PI / 5);
      const pts: number[] = [];
      for (let i = 0; i < 5; i += 1) {
        const a = spin - Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const b = spin - Math.PI / 2 + (((i + 2) % 5) * 2 * Math.PI) / 5;
        pts.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
        pts.push(Math.cos(b) * radius, y, Math.sin(b) * radius);
      }
      const star = line(pts, GOLD, 0.9);
      scene.add(star);
      stars.push(star);

      if (n < MAX_LEVEL) {
        const radius2 = levelRadius(n + 1);
        const y2 = levelHeight(n + 1);
        const spin2 = (n + 1) * (Math.PI / 5);
        const cpts: number[] = [];
        for (let i = 0; i < 5; i += 1) {
          const a = spin - Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const b = spin2 - Math.PI / 2 + (i * 2 * Math.PI) / 5;
          cpts.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
          cpts.push(Math.cos(b) * radius2, y2, Math.sin(b) * radius2);
        }
        const cone = line(cpts, MUTED, 0.45);
        scene.add(cone);
        cones.push(cone);
      }
    }

    const heatPts: number[] = [];
    for (let i = 0; i <= 64; i += 1) {
      const h = i / 64;
      const x = (h - 0.5) * 5.2;
      const y = heatProfileY(h);
      if (i > 0) {
        const hp = (i - 1) / 64;
        heatPts.push((hp - 0.5) * 5.2, heatProfileY(hp), 2.35, x, y, 2.35);
      }
    }
    const heatCurve = line(heatPts, PAPER, 0.85);
    scene.add(heatCurve);
    const heatFloor = line([-2.6, 0.02, 2.35, 2.6, 0.02, 2.35], MUTED, 0.4);
    scene.add(heatFloor);

    const ninePts: number[] = [];
    const NINE_C = new THREE.Vector3(-3.15, 1.55, 0.15);
    const NINE_R = 1.35;
    for (let i = 0; i <= 64; i += 1) {
      const a0 = (i / 64) * Math.PI * 2;
      const a1 = ((i + 1) / 64) * Math.PI * 2;
      ninePts.push(
        NINE_C.x,
        NINE_C.y + Math.cos(a0) * NINE_R,
        NINE_C.z + Math.sin(a0) * NINE_R,
        NINE_C.x,
        NINE_C.y + Math.cos(a1) * NINE_R,
        NINE_C.z + Math.sin(a1) * NINE_R,
      );
    }
    const nineRing = line(ninePts, GOLD, 0.55);
    scene.add(nineRing);
    const tickGroup = new THREE.Group();
    scene.add(tickGroup);
    for (let d = 0; d < 9; d += 1) {
      const a = -Math.PI / 2 + (d / 9) * Math.PI * 2;
      const inner = 1.22;
      const outer = d === 0 ? 1.58 : 1.42;
      const tick = line(
        [
          NINE_C.x,
          NINE_C.y + Math.cos(a) * inner,
          NINE_C.z + Math.sin(a) * inner,
          NINE_C.x,
          NINE_C.y + Math.cos(a) * outer,
          NINE_C.z + Math.sin(a) * outer,
        ],
        PAPER,
        0.7,
      );
      tickGroup.add(tick);
      const label = makeLabel(d === 0 ? "0/9" : String(d), "#efe8d8");
      label.position.set(
        NINE_C.x,
        NINE_C.y + Math.cos(a) * 1.82,
        NINE_C.z + Math.sin(a) * 1.82,
      );
      tickGroup.add(label);
    }

    const cylGroup = new THREE.Group();
    cylGroup.position.set(-2.15, 0, -2.55);
    scene.add(cylGroup);
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 3.1, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
      }),
    );
    shell.position.y = 1.55;
    cylGroup.add(shell);
    for (let i = 0; i < 8; i += 1) {
      const y = 0.2 + i * 0.38;
      const ringPts: number[] = [];
      for (let k = 0; k < 24; k += 1) {
        const a0 = (k / 24) * Math.PI * 2;
        const a1 = ((k + 1) / 24) * Math.PI * 2;
        ringPts.push(Math.cos(a0) * 0.72, y, Math.sin(a0) * 0.72);
        ringPts.push(Math.cos(a1) * 0.72, y, Math.sin(a1) * 0.72);
      }
      cylGroup.add(line(ringPts, MUTED, 0.55));
    }
    const front = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
    );
    front.position.set(0, 1.55, 0.74);
    cylGroup.add(front);
    const sizeLabel = makeLabel("size", "#d4a054");
    sizeLabel.position.set(1.15, 0.2, 0);
    cylGroup.add(sizeLabel);

    const residualGroup = new THREE.Group();
    scene.add(residualGroup);
    const arcA = radiusArc(PHI_INV * 1.9, PAPER, 0.9);
    const arcB = radiusArc(PHI_INV2 * 1.9, GOLD, 0.9);
    residualGroup.add(arcA);
    residualGroup.add(arcB);
    const gap = line(
      [PHI_INV2 * 1.9, 0.04, 0, PHI_INV * 1.9, 0.04, 0],
      0xe7d7b8,
      1,
    );
    residualGroup.add(gap);
    const resLabel = makeLabel("√5−2", "#d4a054");
    resLabel.position.set(((PHI_INV + PHI_INV2) / 2) * 1.9, 0.28, 0.28);
    residualGroup.add(resLabel);

    const markerGeo = new THREE.SphereGeometry(0.075, 18, 18);
    const markerMat = new THREE.MeshStandardMaterial({
      color: GOLD,
      emissive: GOLD,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });
    const observer = new THREE.Mesh(markerGeo, markerMat);
    scene.add(observer);
    const dropMat = new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.35 });
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Array(18).fill(0), 3));
    const drops = new THREE.LineSegments(dropGeo, dropMat);
    scene.add(drops);

    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: PAPER, emissive: PAPER, emissiveIntensity: 0.2 }),
    );
    scene.add(bead);
    const heatDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.45 }),
    );
    scene.add(heatDot);

    const TRAIL = 160;
    const trail: THREE.Vector3[] = [];
    const trailGeo = new THREE.BufferGeometry();
    const trailLine = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.7 }),
    );
    scene.add(trailLine);

    const look = new THREE.Vector3(0, 1.15, 0);
    const desired = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    const clock = new THREE.Clock();
    let t = 0;
    let acc = 0;
    let lastTrail = 0;
    let seenReset = resetRef.current;
    let alive = true;

    const resize = () => {
      if (!el) return;
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const frame = () => {
      if (!alive) return;
      if (resetRef.current !== seenReset) {
        seenReset = resetRef.current;
        t = 0;
        trail.length = 0;
        trailGeo.setFromPoints(trail);
      }
      const dt = Math.min(0.05, clock.getDelta());
      if (runningRef.current) t += dt;
      const sample = sampleScale(t, rateRef.current, probeRef.current);
      const show = layersRef.current;

      stars.forEach((star, n) => {
        const near = 1 - Math.min(1, Math.abs(n - sample.level) / 1.4);
        const mat = star.material as THREE.LineBasicMaterial;
        mat.opacity = show.orbit ? 0.15 + near * 0.85 : 0;
      });
      cones.forEach((cone) => {
        (cone.material as THREE.LineBasicMaterial).opacity = show.orbit ? 0.28 : 0;
      });
      (heatCurve.material as THREE.LineBasicMaterial).opacity = show.heat ? 0.9 : 0;
      (heatFloor.material as THREE.LineBasicMaterial).opacity = show.heat ? 0.35 : 0;
      heatDot.visible = show.heat;
      (nineRing.material as THREE.LineBasicMaterial).opacity = show.nine ? 0.55 : 0;
      tickGroup.visible = show.nine;
      bead.visible = show.nine;
      cylGroup.visible = show.cylinder;
      residualGroup.visible = show.residual;

      const radius = levelRadius(sample.level);
      const y = levelHeight(sample.level);
      const spin = sample.level * (Math.PI / 5);
      const walked = walkStar(sample.H, radius, y, spin);
      observer.position.set(walked[0], walked[1], walked[2]);

      const hx = (sample.H - 0.5) * 5.2;
      const hy = heatProfileY(sample.H);
      heatDot.position.set(hx, hy, 2.35);

      const ang = -Math.PI / 2 + (sample.inward / 9) * Math.PI * 2;
      bead.position.set(NINE_C.x, NINE_C.y + Math.cos(ang) * NINE_R, NINE_C.z + Math.sin(ang) * NINE_R);

      const band = cylGroup.getObjectByName("band");
      if (band) band.position.y = 0.2 + sample.H * 2.7;

      const dropArr = dropGeo.attributes.position as THREE.BufferAttribute;
      const triples = [walked, [hx, hy, 2.35], [bead.position.x, bead.position.y, bead.position.z]];
      for (let i = 0; i < 3; i += 1) {
        const p = triples[i];
        if (!p) continue;
        dropArr.setXYZ(i * 2, walked[0], walked[1], walked[2]);
        dropArr.setXYZ(i * 2 + 1, p[0], p[1], p[2]);
      }
      dropArr.needsUpdate = true;

      if (t - lastTrail > 0.045) {
        lastTrail = t;
        trail.push(new THREE.Vector3(walked[0], walked[1], walked[2]));
        if (trail.length > TRAIL) trail.shift();
        trailGeo.setFromPoints(trail);
      }

      const mode = viewRef.current;
      if (mode === "watch") {
        controls.enabled = true;
        controls.update();
      } else {
        controls.enabled = false;
        if (mode === "observer") {
          desired.set(walked[0] + 1.15, walked[1] + 0.55, walked[2] + 1.35);
          desiredTarget.set(walked[0], walked[1], walked[2]);
        } else if (mode === "forward") {
          desired.set(0.2, 0.8, 6.4);
          desiredTarget.set(0, 2.1, 0);
        } else if (mode === "adjacent") {
          desired.set(7.4, 1.8, 2.4);
          desiredTarget.set(0, 1.2, 0);
        } else {
          desired.set(0.15, 8.8, 0.15);
          desiredTarget.set(0, 1.2, 0);
        }
        const k = reduced ? 1 : 0.08;
        camera.position.lerp(desired, k);
        look.lerp(desiredTarget, k);
        camera.lookAt(look);
      }

      acc += dt;
      if (acc > 0.1) {
        acc = 0;
        onSampleRef.current(sample);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    };

    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.015, 8, 24),
      new THREE.MeshBasicMaterial({ color: PAPER }),
    );
    band.name = "band";
    band.rotation.x = Math.PI / 2;
    cylGroup.add(band);

    onSampleRef.current(sampleScale(0, rateRef.current, probeRef.current));
    requestAnimationFrame(frame);

    return () => {
      alive = false;
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
    };
  }, []);

  return <div ref={host} className="absolute inset-0" />;
}

function heatProfileY(h: number): number {
  return 0.08 + h * (1 - h) * 3.4;
}

function radiusArc(radius: number, color: number, opacity: number): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const a = (i / 32) * Math.PI * 0.5;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0.04, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}
