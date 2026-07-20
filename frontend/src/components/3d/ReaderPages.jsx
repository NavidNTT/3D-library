import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createTextTexture } from "../../utils/textToTexture";

const PAGE_WIDTH = 1.04;
const PAGE_HEIGHT = 1.52;
const SEGMENTS = 32;
const DRAG_DISTANCE = 220;
// A finished turn stops just short of PI so the page rests on the opened
// cover (which lies nearly flat at -3.10) instead of clipping through it.
const MAX_ANGLE = 3.08;
const CURL = 0.42; // static mid-turn bend, radians at the free edge
const LAG = 0.22; // how much the free edge trails the spine during fast turns

let shadowMap = null;
function getShadowTexture() {
  if (shadowMap) return shadowMap;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 32, 4, 64, 32, 60);
  gradient.addColorStop(0, "rgba(20, 10, 4, 1)");
  gradient.addColorStop(1, "rgba(20, 10, 4, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 64);
  shadowMap = new THREE.CanvasTexture(canvas);
  return shadowMap;
}

function PageSheet({ page, isPast, stackOffset, dragT }) {
  const shadow = useRef();
  // t: displayed turn progress 0..1, vel: dt/dt for edge lag. Survives role
  // changes (current -> past) because the component is keyed by page id.
  const sim = useRef({ t: isPast ? 1 : 0, vel: 0, settled: false });

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, SEGMENTS, 1);
    plane.translate(PAGE_WIDTH / 2, 0, 0); // spine (pivot) at local x = 0
    return plane;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const texture = useMemo(() => createTextTexture({
    title: page.chapter_title,
    text: page.content_fa || page.content_en || "",
    pageNumber: page.page_number,
    type: page.type,
  }), [page]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05); // avoid jumps after tab refocus
    const s = sim.current;
    const target = dragT ?? (isPast ? 1 : 0);
    const speed = dragT != null ? 20 : page.type === "blank" ? 4.2 : 7.5;
    const previous = s.t;
    s.t = THREE.MathUtils.damp(s.t, target, speed, delta);
    s.vel = THREE.MathUtils.damp(s.vel, (s.t - previous) / Math.max(delta, 1e-4), 12, delta);

    const atRest = dragT == null && Math.abs(s.t - target) < 0.0008 && Math.abs(s.vel) < 0.01;
    if (atRest && s.settled) return; // skip vertex work for pages lying still
    s.settled = atRest;
    if (atRest) { s.t = target; s.vel = 0; }

    // The page is an inextensible strip hinged at the spine. Local bend angle:
    //   phi(u) = phi0 + b * u^1.7,  u = arc position / width
    // b < 0 curls the free edge back toward where the turn started (paper
    // stiffness) and the velocity term makes the edge trail during fast turns.
    const phi0 = s.t * MAX_ANGLE;
    const b = -(CURL * Math.sin(s.t * Math.PI) + LAG * THREE.MathUtils.clamp(s.vel, -2.5, 2.5));
    const step = PAGE_WIDTH / SEGMENTS;
    const colX = new Float32Array(SEGMENTS + 1);
    const colZ = new Float32Array(SEGMENTS + 1);
    let px = 0;
    let pz = 0;
    for (let col = 1; col <= SEGMENTS; col += 1) {
      // midpoint integration preserves arc length (paper doesn't stretch)
      const uMid = (col - 0.5) / SEGMENTS;
      const phi = phi0 + b * Math.pow(uMid, 1.7);
      px += Math.cos(phi) * step;
      pz += Math.sin(phi) * step;
      colX[col] = px;
      colZ[col] = pz;
    }
    const position = geometry.attributes.position;
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      const col = vertex % (SEGMENTS + 1);
      position.setX(vertex, colX[col]);
      position.setZ(vertex, colZ[col]);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Fake contact shadow cast on the page beneath, tracking the free edge.
    if (shadow.current) {
      const tipX = colX[SEGMENTS];
      const lift = Math.sin(s.t * Math.PI);
      shadow.current.material.opacity = lift * 0.42;
      shadow.current.position.x = tipX * 0.5 + PAGE_WIDTH * 0.12;
      shadow.current.scale.x = THREE.MathUtils.clamp(Math.abs(tipX) / PAGE_WIDTH + 0.25, 0.3, 1.1);
    }
  });

  return (
    <group position={[0, 0, stackOffset]}>
      <mesh ref={shadow} position={[PAGE_WIDTH / 2, 0, 0.002]} raycast={() => null}>
        <planeGeometry args={[PAGE_WIDTH * 1.1, PAGE_HEIGHT * 1.05]} />
        <meshBasicMaterial map={getShadowTexture()} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh geometry={geometry} castShadow receiveShadow raycast={() => null}>
        <meshStandardMaterial map={texture} side={THREE.FrontSide} roughness={0.92} />
      </mesh>
      {/* back face: plain paper, shares the deformed geometry */}
      <mesh geometry={geometry} raycast={() => null}>
        <meshStandardMaterial color="#e7d9b2" side={THREE.BackSide} roughness={0.96} />
      </mesh>
    </group>
  );
}

export default function ReaderPages({ pages, currentIndex, onNext, onPrevious }) {
  const [drag, setDrag] = useState(null);
  const hasNext = currentIndex < pages.length - 1;
  const hasPrevious = currentIndex > 0;

  // auto-flip blank filler pages
  useEffect(() => {
    const current = pages[currentIndex];
    if (current?.type !== "blank") return undefined;
    const timeout = window.setTimeout(onNext, 620);
    return () => window.clearTimeout(timeout);
  }, [currentIndex, onNext, pages]);

  const progress = drag ? (drag.startX - drag.x) / DRAG_DISTANCE : 0;
  // forward drag bends the current sheet, backward drag un-turns the previous one
  const forwardT = drag && progress > 0 && hasNext ? THREE.MathUtils.clamp(progress, 0, 1) : null;
  const backwardT = drag && progress < 0 && hasPrevious ? THREE.MathUtils.clamp(1 + progress, 0, 1) : null;

  const visible = [currentIndex - 1, currentIndex, currentIndex + 1]
    .filter((index) => index >= 0 && index < Math.max(pages.length, 1))
    .map((index) => ({ page: pages[index] ?? { type: "blank", page_number: 1 }, index }));

  const remaining = Math.max(pages.length - currentIndex, 1);

  return (
    <group position={[0, 0, 0.185]}>
      {/* page block under the visible sheets; thins out as the book is read */}
      <mesh position={[0, 0, -0.02 - remaining * 0.004]} receiveShadow>
        <boxGeometry args={[PAGE_WIDTH + 0.02, PAGE_HEIGHT + 0.04, 0.04 + remaining * 0.008]} />
        <meshStandardMaterial color="#d8c797" roughness={0.95} />
      </mesh>
      <group position={[-PAGE_WIDTH / 2, 0, 0]}>
        {visible.map(({ page, index }) => (
          <PageSheet
            key={page.id ?? index}
            page={page}
            isPast={index < currentIndex}
            stackOffset={index < currentIndex ? 0.016 : 0.006 - (index - currentIndex) * 0.003}
            dragT={index === currentIndex ? forwardT : index === currentIndex - 1 ? backwardT : null}
          />
        ))}
        {/* invisible drag surface covering the whole spread */}
        <mesh
          position={[0, 0, 0.3]}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.target.setPointerCapture(event.pointerId);
            setDrag({ startX: event.clientX, x: event.clientX });
          }}
          onPointerMove={(event) => drag && setDrag((value) => ({ ...value, x: event.clientX }))}
          onPointerUp={(event) => {
            if (!drag) return;
            const released = (drag.startX - event.clientX) / DRAG_DISTANCE;
            setDrag(null);
            if (released > 0.24 && hasNext) onNext();
            else if (released < -0.24 && hasPrevious) onPrevious();
          }}
          onPointerCancel={() => setDrag(null)}
        >
          <planeGeometry args={[PAGE_WIDTH * 2.3, PAGE_HEIGHT * 1.15]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
