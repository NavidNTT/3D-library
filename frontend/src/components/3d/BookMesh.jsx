import { RoundedBox, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import useBookStore from "../../store/useBookStore";
import { COLORS } from "../../theme/tokens";
import { createCoverTexture, createSpineTexture } from "../../utils/coverTexture";
import ReaderPages from "./ReaderPages";

const BOOK = { width: 1.12, height: 1.66, depth: 0.32 };

// Poses: on the shelf books stand spine-out (rotation.y = PI/2 turns local -X, the spine, toward camera).
const SHELF_ROT = Math.PI / 2;
const HOVER_ROT = 1.02;
const OPEN_POSITION = new THREE.Vector3(0.7, 0.05, 2.2); // shifts right so the centered spine of the open spread sits at x=0
const OPEN_SCALE = 1.25;
const GLOW = new THREE.Color(COLORS.gold);
const _tooltipAnchor = new THREE.Vector3();

export default function BookMesh({ book, position, selected, pages, currentIndex, onSelect, onClose, onNext, onPrevious }) {
  const root = useRef();
  const coverPivot = useRef();
  const bodyMaterial = useRef();
  const spineMaterial = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !selected);
  const setHoveredBook = useBookStore((state) => state.setHoveredBook);
  const { camera, size } = useThree();

  const color = book.cover_color || book.genre?.color_hex || "#563523";
  const coverMap = useMemo(() => createCoverTexture(book, color), [book, color]);
  const spineMap = useMemo(() => createSpineTexture(book, color), [book, color]);

  const shelfPosition = useMemo(() => new THREE.Vector3(...position), [position]);
  const hoverPosition = useMemo(() => new THREE.Vector3(position[0], position[1] + 0.02, position[2] + 0.34), [position]);

  const { width, height, depth } = BOOK;

  useFrame((_, delta) => {
    if (!root.current) return;
    const target = selected ? OPEN_POSITION : hovered ? hoverPosition : shelfPosition;
    root.current.position.lerp(target, 1 - Math.exp(-delta * 5));
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, selected ? 0 : hovered ? HOVER_ROT : SHELF_ROT, 6.5, delta);
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, selected ? OPEN_SCALE : 1, 6.5, delta));
    if (coverPivot.current) coverPivot.current.rotation.y = THREE.MathUtils.damp(coverPivot.current.rotation.y, selected ? -3.1 : 0, 5.5, delta);

    // Candle-catch: gold emissive glow eases in while hovered
    const glowTarget = hovered && !selected ? 0.22 : 0;
    for (const material of [bodyMaterial.current, spineMaterial.current]) {
      if (!material) continue;
      material.emissiveIntensity = THREE.MathUtils.damp(material.emissiveIntensity, glowTarget, 8, delta);
    }

    // Project the book's top edge to screen space for the DOM tooltip
    if (hovered && !selected) {
      _tooltipAnchor.copy(root.current.position).y += height * 0.62;
      _tooltipAnchor.project(camera);
      setHoveredBook(book, {
        x: (_tooltipAnchor.x * 0.5 + 0.5) * size.width,
        y: (-_tooltipAnchor.y * 0.5 + 0.5) * size.height,
      });
    }
  });

  const onOver = (event) => { event.stopPropagation(); setHovered(true); };
  const onOut = () => { setHovered(false); setHoveredBook(null); };

  return (
    <group
      ref={root}
      position={position}
      rotation={[0, SHELF_ROT, 0]}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={(event) => {
        event.stopPropagation();
        if (!selected) onSelect(book.id);
      }}
    >
      {/* Closed body: leather block + cream fore-edge suggesting the page block */}
      <RoundedBox args={[width, height, depth]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial ref={bodyMaterial} color={color} roughness={0.52} metalness={0.06} emissive={GLOW} emissiveIntensity={0} />
      </RoundedBox>
      <mesh position={[width / 2 - 0.01, 0, 0]}>
        <boxGeometry args={[0.055, height - 0.14, depth - 0.07]} />
        <meshStandardMaterial color={COLORS.paperEdge} roughness={0.95} />
      </mesh>

      {/* Decorated spine (texture carries bands + vertical title) */}
      <mesh position={[-width / 2 - 0.004, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height * 0.985]} />
        <meshStandardMaterial ref={spineMaterial} map={spineMap} roughness={0.5} metalness={0.14} emissive={GLOW} emissiveIntensity={0} />
      </mesh>

      {/* Front cover art on the closed block — hidden once the hinged cover takes over */}
      {!selected && (
        <mesh position={[0, 0, depth / 2 + 0.004]}>
          <planeGeometry args={[width * 0.985, height * 0.985]} />
          <meshStandardMaterial map={coverMap} roughness={0.5} metalness={0.14} />
        </mesh>
      )}

      {selected && (
        <>
          {/* Hinged front cover, pivoting at the spine edge */}
          <group ref={coverPivot} position={[-width / 2, 0, depth / 2]}>
            <group position={[width / 2, 0, 0.03]}>
              <RoundedBox args={[width, height, 0.05]} radius={0.03} smoothness={3} castShadow>
                <meshStandardMaterial color={color} roughness={0.5} />
              </RoundedBox>
              <mesh position={[0, 0, 0.029]}>
                <planeGeometry args={[width * 0.985, height * 0.985]} />
                <meshStandardMaterial map={coverMap} roughness={0.5} metalness={0.14} />
              </mesh>
            </group>
          </group>
          <ReaderPages pages={pages} currentIndex={currentIndex} onNext={onNext} onPrevious={onPrevious} onClose={onClose} />
        </>
      )}
    </group>
  );
}
