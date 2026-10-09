import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as SphereGeometry, D as Vector3, E as TorusGeometry, S as Scene, T as SpriteMaterial, _ as MeshBasicMaterial, a as CanvasTexture, b as RingGeometry, c as DirectionalLight, d as GridHelper, f as Group, g as Mesh, h as LineSegments, i as BufferGeometry, l as Float32BufferAttribute, m as LineBasicMaterial, n as WebGLRenderer, o as Clock, p as Line, r as AmbientLight, s as CylinderGeometry, t as OrbitControls, u as Fog, v as MeshStandardMaterial, w as Sprite, x as SRGBColorSpace, y as PerspectiveCamera } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-U6x7tpRG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Great Scale arithmetic taken from the notebook and the descent through it. */
var PHI = (1 + Math.sqrt(5)) / 2;
var PHI_INV = (Math.sqrt(5) - 1) / 2;
var PHI_INV2 = (3 - Math.sqrt(5)) / 2;
/** φ^{-1} − φ^{-2}. The orbit refuses the midpoint by exactly this much. */
var RESIDUAL = Math.sqrt(5) - 2;
var ACTION = -1 / 6;
var COMPLEMENT_PAIRS = [
	[0, 9],
	[1, 8],
	[2, 7],
	[3, 6],
	[4, 5]
];
/** Ordinary residue that keeps the fraction: 17.2 → 8.2. Digital root, 9 stays 9. */
function digitResidue(x) {
	if (!Number.isFinite(x)) return 0;
	const neg = x < 0;
	const ax = Math.abs(x);
	const frac = ax - Math.floor(ax);
	let n = Math.floor(ax);
	if (n === 0) return neg ? -frac : frac;
	while (n >= 10) {
		let s = 0;
		let m = n;
		while (m > 0) {
			s += m % 10;
			m = Math.floor(m / 10);
		}
		n = s;
	}
	const r = n + frac;
	return neg ? -r : r;
}
/**
* Inward fold. 8.2 is the outward residue; its complement to 9 is 0.8.
* Fixed points on one turn of the scaffold are 0 and 4.5.
*/
function inwardFold(x) {
	const r = digitResidue(Math.abs(x));
	return r > 4.5 ? 9 - r : r;
}
function heatProfile(h) {
	return h * (1 - h);
}
/** Verhulst. Inflection, and the maximum of stress, sits at H = 1/2. */
function logistic(t, rate, mid = 3.4) {
	const z = -rate * (t - mid);
	return 1 / (1 + Math.exp(Math.max(-40, Math.min(40, z))));
}
function smoothstep(edge0, edge1, x) {
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}
function sampleScale(t, rate, probe) {
	const H = logistic(t, rate);
	const S = heatProfile(H);
	const stress = rate * S;
	const residue = digitResidue(probe);
	const inward = inwardFold(probe);
	const level = smoothstep(.42, .78, H) * 8;
	const lambda = PHI ** -level;
	const cone = PHI ** (-2 * Math.floor(level / 2));
	const heatGap = Math.min(H, 1 - H);
	return {
		t,
		H,
		S,
		stress,
		residue,
		inward,
		level,
		lambda,
		cone,
		heatGap,
		psi: heatGap + RESIDUAL,
		residual: RESIDUAL
	};
}
function pentagramVertex(index, radius, y, spin) {
	const a = spin - Math.PI / 2 + index * 2 * Math.PI / 5;
	return [
		Math.cos(a) * radius,
		y,
		Math.sin(a) * radius
	];
}
/** Point walking the pentagram stroke (every second vertex) at fraction u in [0, 1). */
function walkStar(u, radius, y, spin) {
	const seg = (u % 1 + 1) % 1 * 5;
	const i = Math.floor(seg);
	const f = seg - i;
	const a = pentagramVertex(i, radius, y, spin);
	const b = pentagramVertex(i + 2, radius, y, spin);
	return [
		a[0] * (1 - f) + b[0] * f,
		y,
		a[2] * (1 - f) + b[2] * f
	];
}
function levelRadius(level, base = 1.9) {
	return base * PHI ** -level;
}
function levelHeight(level) {
	return .12 + level * .46;
}
function fmt(n, digits = 4) {
	if (!Number.isFinite(n)) return "—";
	return (n < 0 ? "−" : "") + Math.abs(n).toFixed(digits);
}
var INK = 1184014;
var PAPER = 15722712;
var GOLD = 13934676;
var MUTED = 9406328;
function makeLabel(text, color) {
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 128;
	const g = canvas.getContext("2d");
	if (!g) return new Sprite();
	g.clearRect(0, 0, 256, 128);
	g.fillStyle = color;
	g.font = "500 64px 'IBM Plex Mono', monospace";
	g.textAlign = "center";
	g.textBaseline = "middle";
	g.fillText(text, 128, 64);
	const tex = new CanvasTexture(canvas);
	tex.colorSpace = SRGBColorSpace;
	const mat = new SpriteMaterial({
		map: tex,
		transparent: true,
		depthWrite: false
	});
	const sprite = new Sprite(mat);
	sprite.scale.set(.62, .31, 1);
	return sprite;
}
function line(points, color, opacity) {
	const geo = new BufferGeometry();
	geo.setAttribute("position", new Float32BufferAttribute(points, 3));
	const mat = new LineBasicMaterial({
		color,
		transparent: true,
		opacity
	});
	return new LineSegments(geo, mat);
}
function ScaleStage({ running, rate, probe, view, layers, resetToken, onSample }) {
	const host = (0, import_react.useRef)(null);
	const runningRef = (0, import_react.useRef)(running);
	const rateRef = (0, import_react.useRef)(rate);
	const probeRef = (0, import_react.useRef)(probe);
	const viewRef = (0, import_react.useRef)(view);
	const layersRef = (0, import_react.useRef)(layers);
	const resetRef = (0, import_react.useRef)(resetToken);
	const onSampleRef = (0, import_react.useRef)(onSample);
	runningRef.current = running;
	rateRef.current = rate;
	probeRef.current = probe;
	viewRef.current = view;
	layersRef.current = layers;
	resetRef.current = resetToken;
	onSampleRef.current = onSample;
	(0, import_react.useEffect)(() => {
		const el = host.current;
		if (!el) return;
		const renderer = new WebGLRenderer({
			antialias: true,
			alpha: false
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setSize(el.clientWidth, el.clientHeight);
		renderer.setClearColor(INK, 1);
		renderer.outputColorSpace = SRGBColorSpace;
		el.appendChild(renderer.domElement);
		const scene = new Scene();
		scene.fog = new Fog(INK, 14, 28);
		const camera = new PerspectiveCamera(42, 1, .05, 80);
		camera.position.set(5.4, 3.1, 6.6);
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.target.set(0, 1.15, 0);
		controls.maxDistance = 18;
		controls.minDistance = 1.2;
		scene.add(new AmbientLight(9076848, .55));
		const key = new DirectionalLight(16769712, 1.35);
		key.position.set(4, 8, 3);
		scene.add(key);
		const fill = new DirectionalLight(8952234, .35);
		fill.position.set(-4, 2, -3);
		scene.add(fill);
		const grid = new GridHelper(12, 24, 3814440, 2762270);
		grid.position.y = 0;
		scene.add(grid);
		const stars = [];
		const cones = [];
		for (let n = 0; n <= 8; n += 1) {
			const radius = levelRadius(n);
			const y = levelHeight(n);
			const spin = n * (Math.PI / 5);
			const pts = [];
			for (let i = 0; i < 5; i += 1) {
				const a = spin - Math.PI / 2 + i * 2 * Math.PI / 5;
				const b = spin - Math.PI / 2 + (i + 2) % 5 * 2 * Math.PI / 5;
				pts.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
				pts.push(Math.cos(b) * radius, y, Math.sin(b) * radius);
			}
			const star = line(pts, GOLD, .9);
			scene.add(star);
			stars.push(star);
			if (n < 8) {
				const radius2 = levelRadius(n + 1);
				const y2 = levelHeight(n + 1);
				const spin2 = (n + 1) * (Math.PI / 5);
				const cpts = [];
				for (let i = 0; i < 5; i += 1) {
					const a = spin - Math.PI / 2 + i * 2 * Math.PI / 5;
					const b = spin2 - Math.PI / 2 + i * 2 * Math.PI / 5;
					cpts.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
					cpts.push(Math.cos(b) * radius2, y2, Math.sin(b) * radius2);
				}
				const cone = line(cpts, MUTED, .45);
				scene.add(cone);
				cones.push(cone);
			}
		}
		const heatPts = [];
		for (let i = 0; i <= 64; i += 1) {
			const h = i / 64;
			const x = (h - .5) * 5.2;
			const y = heatProfileY(h);
			if (i > 0) {
				const hp = (i - 1) / 64;
				heatPts.push((hp - .5) * 5.2, heatProfileY(hp), 2.35, x, y, 2.35);
			}
		}
		const heatCurve = line(heatPts, PAPER, .85);
		scene.add(heatCurve);
		const heatFloor = line([
			-2.6,
			.02,
			2.35,
			2.6,
			.02,
			2.35
		], MUTED, .4);
		scene.add(heatFloor);
		const ninePts = [];
		const NINE_C = new Vector3(-3.15, 1.55, .15);
		const NINE_R = 1.35;
		for (let i = 0; i <= 64; i += 1) {
			const a0 = i / 64 * Math.PI * 2;
			const a1 = (i + 1) / 64 * Math.PI * 2;
			ninePts.push(NINE_C.x, NINE_C.y + Math.cos(a0) * NINE_R, NINE_C.z + Math.sin(a0) * NINE_R, NINE_C.x, NINE_C.y + Math.cos(a1) * NINE_R, NINE_C.z + Math.sin(a1) * NINE_R);
		}
		const nineRing = line(ninePts, GOLD, .55);
		scene.add(nineRing);
		const tickGroup = new Group();
		scene.add(tickGroup);
		for (let d = 0; d < 9; d += 1) {
			const a = -Math.PI / 2 + d / 9 * Math.PI * 2;
			const inner = 1.22;
			const outer = d === 0 ? 1.58 : 1.42;
			const tick = line([
				NINE_C.x,
				NINE_C.y + Math.cos(a) * inner,
				NINE_C.z + Math.sin(a) * inner,
				NINE_C.x,
				NINE_C.y + Math.cos(a) * outer,
				NINE_C.z + Math.sin(a) * outer
			], PAPER, .7);
			tickGroup.add(tick);
			const label = makeLabel(d === 0 ? "0/9" : String(d), "#efe8d8");
			label.position.set(NINE_C.x, NINE_C.y + Math.cos(a) * 1.82, NINE_C.z + Math.sin(a) * 1.82);
			tickGroup.add(label);
		}
		const cylGroup = new Group();
		cylGroup.position.set(-2.15, 0, -2.55);
		scene.add(cylGroup);
		const shell = new Mesh(new CylinderGeometry(.72, .72, 3.1, 24, 1, true), new MeshBasicMaterial({
			color: GOLD,
			transparent: true,
			opacity: .08,
			side: 2
		}));
		shell.position.y = 1.55;
		cylGroup.add(shell);
		for (let i = 0; i < 8; i += 1) {
			const y = .2 + i * .38;
			const ringPts = [];
			for (let k = 0; k < 24; k += 1) {
				const a0 = k / 24 * Math.PI * 2;
				const a1 = (k + 1) / 24 * Math.PI * 2;
				ringPts.push(Math.cos(a0) * .72, y, Math.sin(a0) * .72);
				ringPts.push(Math.cos(a1) * .72, y, Math.sin(a1) * .72);
			}
			cylGroup.add(line(ringPts, MUTED, .55));
		}
		const front = new Mesh(new RingGeometry(.45, .5, 32), new MeshBasicMaterial({
			color: GOLD,
			side: 2,
			transparent: true,
			opacity: .8
		}));
		front.position.set(0, 1.55, .74);
		cylGroup.add(front);
		const sizeLabel = makeLabel("size", "#d4a054");
		sizeLabel.position.set(1.15, .2, 0);
		cylGroup.add(sizeLabel);
		const residualGroup = new Group();
		scene.add(residualGroup);
		const arcA = radiusArc(PHI_INV * 1.9, PAPER, .9);
		const arcB = radiusArc(PHI_INV2 * 1.9, GOLD, .9);
		residualGroup.add(arcA);
		residualGroup.add(arcB);
		const gap = line([
			PHI_INV2 * 1.9,
			.04,
			0,
			PHI_INV * 1.9,
			.04,
			0
		], 15194040, 1);
		residualGroup.add(gap);
		const resLabel = makeLabel("√5−2", "#d4a054");
		resLabel.position.set((PHI_INV + PHI_INV2) / 2 * 1.9, .28, .28);
		residualGroup.add(resLabel);
		const markerGeo = new SphereGeometry(.075, 18, 18);
		const markerMat = new MeshStandardMaterial({
			color: GOLD,
			emissive: GOLD,
			emissiveIntensity: .35,
			roughness: .4
		});
		const observer = new Mesh(markerGeo, markerMat);
		scene.add(observer);
		const dropMat = new LineBasicMaterial({
			color: PAPER,
			transparent: true,
			opacity: .35
		});
		const dropGeo = new BufferGeometry();
		dropGeo.setAttribute("position", new Float32BufferAttribute(new Array(18).fill(0), 3));
		const drops = new LineSegments(dropGeo, dropMat);
		scene.add(drops);
		const bead = new Mesh(new SphereGeometry(.07, 16, 16), new MeshStandardMaterial({
			color: PAPER,
			emissive: PAPER,
			emissiveIntensity: .2
		}));
		scene.add(bead);
		const heatDot = new Mesh(new SphereGeometry(.07, 16, 16), new MeshStandardMaterial({
			color: GOLD,
			emissive: GOLD,
			emissiveIntensity: .45
		}));
		scene.add(heatDot);
		const TRAIL = 160;
		const trail = [];
		const trailGeo = new BufferGeometry();
		const trailLine = new Line(trailGeo, new LineBasicMaterial({
			color: GOLD,
			transparent: true,
			opacity: .7
		}));
		scene.add(trailLine);
		const look = new Vector3(0, 1.15, 0);
		const desired = new Vector3();
		const desiredTarget = new Vector3();
		const clock = new Clock();
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
			const dt = Math.min(.05, clock.getDelta());
			if (runningRef.current) t += dt;
			const sample = sampleScale(t, rateRef.current, probeRef.current);
			const show = layersRef.current;
			stars.forEach((star, n) => {
				const near = 1 - Math.min(1, Math.abs(n - sample.level) / 1.4);
				const mat = star.material;
				mat.opacity = show.orbit ? .15 + near * .85 : 0;
			});
			cones.forEach((cone) => {
				cone.material.opacity = show.orbit ? .28 : 0;
			});
			heatCurve.material.opacity = show.heat ? .9 : 0;
			heatFloor.material.opacity = show.heat ? .35 : 0;
			heatDot.visible = show.heat;
			nineRing.material.opacity = show.nine ? .55 : 0;
			tickGroup.visible = show.nine;
			bead.visible = show.nine;
			cylGroup.visible = show.cylinder;
			residualGroup.visible = show.residual;
			const radius = levelRadius(sample.level);
			const y = levelHeight(sample.level);
			const spin = sample.level * (Math.PI / 5);
			const walked = walkStar(sample.H, radius, y, spin);
			observer.position.set(walked[0], walked[1], walked[2]);
			const hx = (sample.H - .5) * 5.2;
			const hy = heatProfileY(sample.H);
			heatDot.position.set(hx, hy, 2.35);
			const ang = -Math.PI / 2 + sample.inward / 9 * Math.PI * 2;
			bead.position.set(NINE_C.x, NINE_C.y + Math.cos(ang) * NINE_R, NINE_C.z + Math.sin(ang) * NINE_R);
			const band = cylGroup.getObjectByName("band");
			if (band) band.position.y = .2 + sample.H * 2.7;
			const dropArr = dropGeo.attributes.position;
			const triples = [
				walked,
				[
					hx,
					hy,
					2.35
				],
				[
					bead.position.x,
					bead.position.y,
					bead.position.z
				]
			];
			for (let i = 0; i < 3; i += 1) {
				const p = triples[i];
				if (!p) continue;
				dropArr.setXYZ(i * 2, walked[0], walked[1], walked[2]);
				dropArr.setXYZ(i * 2 + 1, p[0], p[1], p[2]);
			}
			dropArr.needsUpdate = true;
			if (t - lastTrail > .045) {
				lastTrail = t;
				trail.push(new Vector3(walked[0], walked[1], walked[2]));
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
					desired.set(walked[0] + 1.15, walked[1] + .55, walked[2] + 1.35);
					desiredTarget.set(walked[0], walked[1], walked[2]);
				} else if (mode === "forward") {
					desired.set(.2, .8, 6.4);
					desiredTarget.set(0, 2.1, 0);
				} else if (mode === "adjacent") {
					desired.set(7.4, 1.8, 2.4);
					desiredTarget.set(0, 1.2, 0);
				} else {
					desired.set(.15, 8.8, .15);
					desiredTarget.set(0, 1.2, 0);
				}
				const k = reduced ? 1 : .08;
				camera.position.lerp(desired, k);
				look.lerp(desiredTarget, k);
				camera.lookAt(look);
			}
			acc += dt;
			if (acc > .1) {
				acc = 0;
				onSampleRef.current(sample);
			}
			renderer.render(scene, camera);
			requestAnimationFrame(frame);
		};
		const band = new Mesh(new TorusGeometry(.72, .015, 8, 24), new MeshBasicMaterial({ color: PAPER }));
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
				const mesh = obj;
				if (mesh.geometry) mesh.geometry.dispose();
				const mat = mesh.material;
				if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
				else mat?.dispose();
			});
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: host,
		className: "absolute inset-0"
	});
}
function heatProfileY(h) {
	return .08 + h * (1 - h) * 3.4;
}
function radiusArc(radius, color, opacity) {
	const pts = [];
	for (let i = 0; i <= 32; i += 1) {
		const a = i / 32 * Math.PI * .5;
		pts.push(new Vector3(Math.cos(a) * radius, .04, Math.sin(a) * radius));
	}
	const geo = new BufferGeometry().setFromPoints(pts);
	return new Line(geo, new LineBasicMaterial({
		color,
		transparent: true,
		opacity
	}));
}
var VIEWS = [
	{
		id: "watch",
		label: "Watch"
	},
	{
		id: "observer",
		label: "Observer"
	},
	{
		id: "forward",
		label: "Forward"
	},
	{
		id: "adjacent",
		label: "Adjacent"
	},
	{
		id: "down",
		label: "Down"
	}
];
var LAYER_KEYS = [
	{
		key: "orbit",
		label: "Orbit"
	},
	{
		key: "heat",
		label: "Heat"
	},
	{
		key: "nine",
		label: "Ninefold"
	},
	{
		key: "cylinder",
		label: "Cylinder"
	},
	{
		key: "residual",
		label: "Residual"
	}
];
var INITIAL = {
	t: 0,
	H: 1 / (1 + Math.exp(.85 * 3.4)),
	S: 0,
	stress: 0,
	residue: 8.2,
	inward: .8,
	level: 0,
	lambda: 1,
	cone: 1,
	heatGap: 0,
	psi: RESIDUAL,
	residual: RESIDUAL
};
function ScaleLab() {
	const [running, setRunning] = (0, import_react.useState)(true);
	const [rate, setRate] = (0, import_react.useState)(.85);
	const [probeText, setProbeText] = (0, import_react.useState)("17.2");
	const [view, setView] = (0, import_react.useState)("watch");
	const [resetToken, setResetToken] = (0, import_react.useState)(0);
	const [layers, setLayers] = (0, import_react.useState)({
		orbit: true,
		heat: true,
		nine: true,
		cylinder: true,
		residual: true
	});
	const [sample, setSample] = (0, import_react.useState)(INITIAL);
	(0, import_react.useEffect)(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(false);
	}, []);
	const probe = Number(probeText);
	const probeSafe = Number.isFinite(probe) ? probe : 17.2;
	const plot = (0, import_react.useMemo)(() => {
		const d = [];
		for (let i = 0; i <= 40; i += 1) {
			const h = i / 40;
			const x = 8 + h * 248;
			const y = 78 - heatProfile(h) * 240;
			d.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
		}
		return d.join(" ");
	}, []);
	const hx = 8 + sample.H * 248;
	const hy = 78 - sample.S * 240;
	const activePair = COMPLEMENT_PAIRS.find((pair) => {
		const r = Math.round(sample.residue);
		return pair[0] === r || pair[1] === r || pair[0] === Math.round(sample.inward);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lab",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "topbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "brand",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Great Scale" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Test environment · three embeddings of one state" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "view-row",
				role: "group",
				"aria-label": "Viewpoint",
				children: VIEWS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "chip",
					"data-on": view === v.id,
					onClick: () => setView(v.id),
					children: v.label
				}, v.id))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stage-wrap",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScaleStage, {
					running,
					rate,
					probe: probeSafe,
					view,
					layers,
					resetToken,
					onSample: setSample
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "dock",
					"aria-label": "Live equations",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "The equation, substituted" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "finding",
							children: "Closure holds on the heat and the ninefold. It fails on the orbit by √5 − 2, and that failure is the cone the marker is walking into."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "eq",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "k",
									children: "S(h) = h(1 − h)"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "S("
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.H, 3)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: ") = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.H, 3)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " × "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(1 - sample.H, 3)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.S, 4)
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "Ḣ = r S(H) = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(rate, 2)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " × "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.S, 4)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.stress, 4)
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "J[S] = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(ACTION, 4)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " = −1/6"
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "ρ("
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(probeSafe, 1)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: ") = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.residue, 1)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " · inward f = 9 − ρ = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.inward, 1)
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "level n = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.level, 2)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " · λ = φ^(−n) = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(sample.lambda, 4)
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "k",
									children: "cone step φ^(−2) at even pairs = "
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "v",
									children: fmt(sample.cone, 4)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "k",
									children: "φ⁻¹ − φ⁻² = √5 − 2 = "
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "v",
									children: fmt(RESIDUAL, 4)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "k",
									children: "Ψ = heat gap + residual = "
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "v",
									children: fmt(sample.psi, 4)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: "φ = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(PHI, 6)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " · φ⁻¹ = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(PHI_INV, 4)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "k",
										children: " · φ⁻² = "
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "v",
										children: fmt(PHI_INV2, 4)
									})
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							className: "plot",
							viewBox: "0 0 264 88",
							role: "img",
							"aria-label": "Heat profile with the moving state",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: "0",
									y: "0",
									width: "264",
									height: "88",
									fill: "#12110e",
									rx: "8"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: plot,
									fill: "none",
									stroke: "#d4a054",
									strokeWidth: "1.6"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: hx,
									y1: "82",
									x2: hx,
									y2: hy,
									stroke: "#8f8778",
									strokeWidth: "1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: hx,
									cy: hy,
									r: "3.5",
									fill: "#efe8d8"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pairs",
							"aria-label": "Complement pairs",
							children: COMPLEMENT_PAIRS.map(([a, b]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								"data-on": activePair?.[0] === a,
								children: [
									a,
									"–",
									b
								]
							}, `${a}-${b}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "note",
							children: "17.2 residues to 8.2. The scale uses the inward fold, 0.8, not 8.2. At 4.5 the complement is a fixed point; the page’s f(4.5) = 9.5 is the pair 4+5 with the center still written on it. Now is the slope Ḣ, largest at one half, which is where the cone opens. Ψ falls toward √5 − 2 and does not reach zero."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "controls",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "transport",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-on": running,
								onClick: () => setRunning((v) => !v),
								children: running ? "Pause" : "Play"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setResetToken((n) => n + 1),
								children: "Replay"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "slider",
							children: [
								"rate r",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "range",
									min: .2,
									max: 2,
									step: .05,
									value: rate,
									onChange: (e) => setRate(Number(e.target.value))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("output", { children: rate.toFixed(2) })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "probe",
							children: ["probe", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								inputMode: "decimal",
								value: probeText,
								onChange: (e) => setProbeText(e.target.value),
								"aria-label": "Probe on the ninefold"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "layer-row",
							children: LAYER_KEYS.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "chip",
								"data-on": layers[layer.key],
								onClick: () => setLayers((prev) => ({
									...prev,
									[layer.key]: !prev[layer.key]
								})),
								children: layer.label
							}, layer.key))
						})
					]
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScaleLab, {});
}
//#endregion
export { Home as component };
