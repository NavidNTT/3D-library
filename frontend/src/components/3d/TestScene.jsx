import { ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import useBookStore from "../../store/useBookStore";
import BookMesh from "./BookMesh";

const _cameraTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const HALF_TAN_FOV = Math.tan(THREE.MathUtils.degToRad(21)); // fov 42

// Procedural env map (three's RoomEnvironment) instead of drei's <Environment
// preset>, which fetches an HDR from a third-party CDN at runtime — that would
// break metals/reflections on a static deploy if the CDN is unreachable.
function LocalEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.45; // keep the moody library feel
    return () => {
      scene.environment = null;
      envMap.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// Single owner of the camera. On mount it performs a cinematic entrance —
// starting low and far like walking up to the shelf — then hands off to the
// parallax/dolly logic. Distances adapt to aspect so the shelf row and the
// opened spread always fit on portrait phones.
const INTRO_START = new THREE.Vector3(-3.2, -2.6, 18);
function CameraRig({ active }) {
  const { camera, pointer, size } = useThree();
  const intro = useRef({ t: 0, done: false });
  useEffect(() => {
    camera.position.copy(INTRO_START);
  }, [camera]);
  useFrame((_, delta) => {
    const aspect = size.width / size.height;
    const visibleHalfWidthAt1 = HALF_TAN_FOV * aspect;
    if (active) {
      // open spread is ~3.25 units wide at z = 2.2; keep half-width 1.8 visible
      const distance = THREE.MathUtils.clamp(1.8 / visibleHalfWidthAt1, 3.3, 7.6);
      _cameraTarget.set(0.25 + pointer.x * 0.1, 0.25 + pointer.y * 0.08, 2.2 + distance);
      _lookTarget.set(0.2, 0, 2.2);
    } else {
      // case is ~8.6 wide / 5 tall; keep half-width 4.6 visible with margin
      const distance = THREE.MathUtils.clamp(4.6 / visibleHalfWidthAt1, 9, 14.5);
      _cameraTarget.set(pointer.x * 0.5, 0.1 + pointer.y * 0.3, distance);
      _lookTarget.set(0, -0.35, 0);
    }
    if (!intro.current.done) {
      // slow ease-out approach; hand off once we're basically at the rest pose
      intro.current.t += delta;
      const k = intro.current.t < 0.4 ? 0.9 : 2.2; // linger, then commit
      camera.position.lerp(_cameraTarget, 1 - Math.exp(-delta * k));
      if (camera.position.distanceTo(_cameraTarget) < 0.08 || active) intro.current.done = true;
    } else {
      camera.position.lerp(_cameraTarget, 1 - Math.exp(-delta * 3.2));
    }
    camera.lookAt(_lookTarget);
  });
  return null;
}

// Translucent panel between the shelf and an opened book: darkens/mutes the background.
function Dimmer({ active }) {
  const material = useRef();
  useFrame((_, delta) => {
    if (material.current) material.current.opacity = THREE.MathUtils.damp(material.current.opacity, active ? 0.72 : 0, 5, delta);
  });
  return (
    <mesh position={[0, 0, 1.15]} renderOrder={2}>
      <planeGeometry args={[40, 24]} />
      <meshBasicMaterial ref={material} color="#050302" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// Two-row bookcase: boards at y 0 / 2.15 / 4.3, sized for ~12 books per row.
function Shelf() {
  return (
    <group position={[0, -2.42, -0.2]}>
      {[0, 2.15, 4.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} receiveShadow>
          <boxGeometry args={[8.6, 0.26, 1.5]} />
          <meshStandardMaterial color="#3c1d0d" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.15, -0.72]} receiveShadow><boxGeometry args={[8.6, 4.7, 0.16]} /><meshStandardMaterial color="#281207" roughness={0.85} /></mesh>
      <mesh position={[-4.25, 2.15, 0]} castShadow><boxGeometry args={[0.28, 4.9, 1.5]} /><meshStandardMaterial color="#4b260f" roughness={0.75} /></mesh>
      <mesh position={[4.25, 2.15, 0]} castShadow><boxGeometry args={[0.28, 4.9, 1.5]} /><meshStandardMaterial color="#4b260f" roughness={0.75} /></mesh>
    </group>
  );
}

const BOOKS_PER_ROW = 12;
const ROW_Y = [-1.46, 0.69]; // book centers resting on the bottom / middle boards

function SceneContent() {
  const { books, selectedBook, pages, isOpen, selectBook, closeBook, currentPageIndex, nextPage, previousPage } = useBookStore();
  const selectedId = selectedBook?.id;
  // Fill rows left-to-right, bottom row first; each row is centered.
  const positions = books.map((_, index) => {
    const row = Math.floor(index / BOOKS_PER_ROW);
    const col = index % BOOKS_PER_ROW;
    const rowCount = Math.min(books.length - row * BOOKS_PER_ROW, BOOKS_PER_ROW);
    return [(col - (rowCount - 1) / 2) * 0.52, ROW_Y[Math.min(row, ROW_Y.length - 1)], 0];
  });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isOpen) return;
      if (event.key === "Escape") closeBook();
      if (event.key === "ArrowRight") nextPage();
      if (event.key === "ArrowLeft") previousPage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeBook, isOpen, nextPage, previousPage]);

  return (
    <>
      <color attach="background" args={["#100908"]} />
      <fog attach="fog" args={["#100908", 13, 24]} />
      <ambientLight intensity={0.45} />
      <spotLight
        position={[1.5, 5.8, 4]}
        intensity={125}
        angle={0.55}
        penumbra={0.65}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-near={2}
        shadow-camera-far={14}
      />
      <pointLight position={[-4, 1.6, 2]} color="#c98037" intensity={22} />
      <Shelf />
      <Dimmer active={isOpen} />
      {books.map((book, index) => (
        <BookMesh
          key={book.id}
          book={book}
          position={positions[index]}
          selected={isOpen && selectedId === book.id}
          pages={selectedId === book.id ? pages : []}
          currentIndex={currentPageIndex}
          onSelect={selectBook}
          onClose={closeBook}
          onNext={nextPage}
          onPrevious={previousPage}
        />
      ))}
      <ContactShadows position={[0, -2.28, 0]} opacity={0.55} scale={10} blur={2.8} far={4} resolution={256} />
      <LocalEnvironment />
      <CameraRig active={isOpen} />
    </>
  );
}

export default function TestScene() {
  return (
    <div className="reader-canvas">
      <Canvas shadows dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[0, 0.1, 12]} fov={42} />
        <Suspense fallback={null}><SceneContent /></Suspense>
      </Canvas>
    </div>
  );
}
