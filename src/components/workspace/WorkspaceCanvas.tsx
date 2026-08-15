"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, ThreeEvent, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Edges,
  ContactShadows,
  Environment,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { DesignJson, Component, Fastener } from "@/types/project";
import { MATERIAL_INFO } from "@/types/project";
import { ForgePieces, ForgeGround } from "@/components/forge/ForgePieces";
import { getCatalogItem } from "@/lib/forge/catalog";
import { toPrimitive } from "@/lib/forge/geometry";

export type CameraPreset = "iso" | "front" | "side" | "top";

interface Props {
  design: DesignJson;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveComponent: (
    id: string,
    position: { x: number; y: number; z: number }
  ) => void;
  explode?: boolean;
  cameraPreset?: CameraPreset;
  highlightIds?: string[] | null;
  /** Forge */
  selectedForgeId?: string | null;
  onSelectForge?: (id: string | null) => void;
  onPlaceForge?: (point: { x: number; y: number; z: number }) => void;
  onMoveForge?: (id: string, pos: { x: number; y: number; z: number }) => void;
}

function FastenerMarker({ fastener }: { fastener: Fastener }) {
  return (
    <group
      position={[
        fastener.position.x,
        fastener.position.y,
        fastener.position.z,
      ]}
    >
      <mesh>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function PanelMesh({
  component,
  selected,
  dimmed,
  explodeOffset,
  onSelect,
  onMove,
  dragAxis,
}: {
  component: Component;
  selected: boolean;
  dimmed?: boolean;
  explodeOffset?: [number, number, number];
  onSelect: () => void;
  onMove: (pos: { x: number; y: number; z: number }) => void;
  dragAxis: "x" | "y" | "none";
}) {
  const off = explodeOffset ?? [0, 0, 0];
  const meshRef = useRef<THREE.Mesh>(null);
  const dragging = useRef(false);
  const dragStart = useRef({
    mouse: new THREE.Vector3(),
    pos: { x: 0, y: 0, z: 0 },
  });

  const mat = MATERIAL_INFO[component.material];
  const color = mat?.color ?? "#d2b48c";
  const metalness = mat?.metalness ?? 0.05;
  const roughness = mat?.roughness ?? 0.55;
  const opacity = mat?.opacity ?? 0.92;
  const isGlass = mat?.category === "glass";
  const { position, size } = component;

  const center: [number, number, number] = [
    position.x + size.width / 2 + off[0],
    position.y + size.height / 2 + off[1],
    position.z + size.depth / 2 + off[2],
  ];

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    if (dragAxis === "none") return;
    dragging.current = true;
    dragStart.current = {
      mouse: e.point.clone(),
      pos: { ...position },
    };
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || dragAxis === "none") return;
    e.stopPropagation();
    const delta = e.point.clone().sub(dragStart.current.mouse);
    const next = { ...dragStart.current.pos };
    if (dragAxis === "y") {
      next.y = Math.round((dragStart.current.pos.y + delta.y) * 4) / 4;
      next.y = Math.max(0, next.y);
    } else if (dragAxis === "x") {
      next.x = Math.round((dragStart.current.pos.x + delta.x) * 4) / 4;
      next.x = Math.max(0, next.x);
    }
    onMove(next);
  };

  const handlePointerUp = () => {
    dragging.current = false;
  };

  useFrame(() => {
    if (meshRef.current && selected) {
      const s = 1 + Math.sin(Date.now() * 0.004) * 0.008;
      meshRef.current.scale.setScalar(s);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={center}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshPhysicalMaterial
        color={selected ? "#38bdf8" : color}
        roughness={selected ? Math.min(roughness, 0.4) : roughness}
        metalness={selected ? Math.max(metalness, 0.15) : metalness}
        transparent={isGlass || opacity < 0.99 || !!dimmed}
        opacity={
          dimmed
            ? 0.18
            : selected
              ? Math.min(0.95, opacity + 0.15)
              : opacity
        }
        transmission={isGlass && !dimmed ? 0.55 : 0}
        thickness={isGlass ? 0.4 : 0}
        envMapIntensity={isGlass || metalness > 0.5 ? 1.2 : 0.6}
        clearcoat={mat?.category === "metal" ? 0.35 : isGlass ? 0.8 : 0.05}
        clearcoatRoughness={0.2}
      />
      <Edges
        color={selected ? "#0369a1" : isGlass ? "#7dd3fc" : "#57534e"}
        threshold={15}
        scale={1.001}
      />
      {/* Visual cutouts as inset dark frames on front face */}
      {component.cutouts?.map((cut) => (
        <mesh
          key={cut.id}
          position={[
            -size.width / 2 + cut.x + cut.width / 2,
            -size.height / 2 + cut.y + cut.height / 2,
            size.depth / 2 + 0.02,
          ]}
        >
          <planeGeometry args={[cut.width, cut.height]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.55} />
        </mesh>
      ))}
      {selected && (
        <Html
          distanceFactor={40}
          position={[0, size.height / 2 + 1.2, 0]}
          center
        >
          <div className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-medium whitespace-nowrap shadow pointer-events-none">
            {component.name}
            {dragAxis !== "none" && (
              <span className="opacity-80">
                {" "}
                · drag {dragAxis === "y" ? "↕" : "↔"}
              </span>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function explodeOffsetFor(
  c: Component,
  overall: DesignJson["overall"],
  explode: boolean
): [number, number, number] {
  if (!explode) return [0, 0, 0];
  const midX = overall.width / 2;
  const midY = overall.height / 2;
  const factor = 0.35;
  const cx = c.position.x + c.size.width / 2;
  const cy = c.position.y + c.size.height / 2;
  const cz = c.position.z + c.size.depth / 2;
  return [
    (cx - midX) * factor,
    (cy - midY) * factor * 0.6,
    (cz - overall.depth / 2) * factor,
  ];
}

function CameraRig({
  preset,
  overall,
}: {
  preset: CameraPreset;
  overall: { width: number; height: number; depth: number };
}) {
  const { camera, controls } = useThree();
  const cx = overall.width / 2;
  const cy = overall.height / 3;
  const cz = overall.depth / 2;

  useMemo(() => {
    const dist = Math.max(overall.width, overall.height, overall.depth) * 1.8;
    let pos: [number, number, number];
    switch (preset) {
      case "front":
        pos = [cx, cy, cz + dist];
        break;
      case "side":
        pos = [cx + dist, cy, cz];
        break;
      case "top":
        pos = [cx, overall.height + dist * 0.8, cz + 0.01];
        break;
      default:
        pos = [cx + dist * 0.7, overall.height * 0.95, cz + dist * 0.9];
    }
    camera.position.set(...pos);
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctrl = controls as any;
    if (ctrl?.target) {
      ctrl.target.set(cx, cy, cz);
      ctrl.update?.();
    }
  }, [preset, overall.width, overall.height, overall.depth, camera, controls, cx, cy, cz]);

  return null;
}

function Scene({
  design,
  selectedId,
  onSelect,
  onMoveComponent,
  explode = false,
  cameraPreset = "iso",
  highlightIds = null,
  selectedForgeId = null,
  onSelectForge,
  onPlaceForge,
  onMoveForge,
}: Props) {
  const { overall, components, fasteners = [] } = design;
  const forgeMode = design.forge?.mode;
  const isForge = forgeMode === "freehand" || forgeMode === "prompt";
  const forgeInstances = design.forgeInstances ?? [];

  const dragAxisFor = (c: Component): "x" | "y" | "none" => {
    if (
      c.type === "shelf" ||
      c.type === "top" ||
      c.type === "bottom" ||
      c.type === "glass_panel"
    )
      return "y";
    if (c.type === "upright" || c.type === "divider" || c.type === "metal_frame")
      return "x";
    return "none";
  };

  // Camera target: center of forge pieces or closet overall
  const camTarget: [number, number, number] = isForge
    ? [
        overall.width / 2 || 12,
        Math.max(overall.height / 3, 8),
        overall.depth / 2 || 0,
      ]
    : [overall.width / 2, overall.height / 3, overall.depth / 2];

  return (
    <>
      <color attach="background" args={["#e8eef4"]} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-20, 30, -15]} intensity={0.4} />
      <pointLight
        position={[
          (overall.width || 24) / 2,
          (overall.height || 24) + 10,
          (overall.depth || 12) / 2,
        ]}
        intensity={0.25}
      />
      <Environment preset="studio" />

      <Grid
        args={[160, 160]}
        cellSize={6}
        cellThickness={0.5}
        sectionSize={12}
        sectionThickness={1}
        sectionColor="#94a3b8"
        cellColor="#cbd5e1"
        fadeDistance={100}
        position={[0, -0.02, 0]}
      />

      <ContactShadows
        position={[(overall.width || 24) / 2, 0.01, (overall.depth || 12) / 2]}
        opacity={0.35}
        scale={80}
        blur={2.5}
        far={20}
      />

      {/* Closet panels — only in closet mode */}
      {!isForge &&
        components.map((c) => {
          const dimmed =
            highlightIds != null &&
            highlightIds.length > 0 &&
            !highlightIds.includes(c.id) &&
            c.id !== selectedId;
          return (
            <PanelMesh
              key={c.id}
              component={c}
              selected={c.id === selectedId}
              dimmed={!!dimmed}
              explodeOffset={explodeOffsetFor(c, overall, !!explode)}
              onSelect={() => onSelect(c.id)}
              onMove={(pos) => onMoveComponent(c.id, pos)}
              dragAxis={dragAxisFor(c)}
            />
          );
        })}

      {!isForge &&
        !explode &&
        fasteners.map((f) => (
          <FastenerMarker key={f.id} fastener={f} />
        ))}

      {/* Forge instances */}
      {isForge && (
        <ForgePieces
          instances={forgeInstances}
          selectedId={selectedForgeId ?? null}
          onSelect={(id) => onSelectForge?.(id)}
          onMove={onMoveForge}
        />
      )}

      {/* Freehand ground click-to-place */}
      {isForge && forgeMode === "freehand" && onPlaceForge && (
        <ForgeGround enabled onPlace={onPlaceForge} />
      )}

      <CameraRig preset={cameraPreset ?? "iso"} overall={overall} />
      <OrbitControls
        makeDefault
        target={camTarget}
        maxPolarAngle={Math.PI * 0.48}
        minDistance={8}
        maxDistance={220}
        enablePan
      />
    </>
  );
}

export function WorkspaceCanvas(props: Props) {
  const { design, explode } = props;
  const { overall } = design;
  const screwCount =
    design.fasteners?.reduce((n, f) => n + f.quantity, 0) ?? 0;
  const isForge =
    design.forge?.mode === "freehand" || design.forge?.mode === "prompt";
  const forgeCount = design.forgeInstances?.length ?? 0;
  const primaryName = design.forge?.primaryMaterialId
    ? getCatalogItem(design.forge.primaryMaterialId)?.name
    : null;

  const camPos: [number, number, number] = isForge
    ? [
        Math.max(overall.width, 24) * 1.2,
        Math.max(overall.height, 24) * 0.9,
        Math.max(overall.depth, 24) * 1.8,
      ]
    : [
        overall.width * 1.5,
        overall.height * 0.95,
        overall.depth * 2.4,
      ];

  return (
    <div className="w-full h-full bg-slate-200 relative">
      <Canvas
        shadows
        camera={{
          position: camPos,
          fov: 42,
        }}
        onPointerMissed={() => {
          props.onSelect(null);
          props.onSelectForge?.(null);
        }}
        className="r3f-canvas"
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <Scene {...props} />
      </Canvas>

      <div className="absolute bottom-3 left-3 text-xs text-slate-600 bg-white/90 px-2.5 py-1.5 rounded shadow-sm">
        {isForge
          ? design.forge?.mode === "freehand"
            ? "Click ground to place · Drag piece · Shift+drag height · Delete · Orbit"
            : "Drag piece · Shift+drag height · Delete · Orbit"
          : `Click · Drag ↕/↔ · Orbit · ${explode ? "Exploded view" : "¼″ snap"}`}
      </div>
      <div className="absolute top-3 left-3 text-xs font-medium text-slate-700 bg-white/95 px-2.5 py-1.5 rounded shadow-sm">
        {isForge ? (
          <>
            {primaryName ?? "Forge"}
            {forgeCount > 0 && (
              <span className="ml-2 text-indigo-600">· {forgeCount} pieces</span>
            )}
            {overall.height > 0 && (
              <span className="ml-2 text-slate-500">
                · ~{overall.height.toFixed(0)}&quot; H
              </span>
            )}
          </>
        ) : (
          <>
            {overall.width}&quot; W × {overall.height}&quot; H × {overall.depth}&quot; D
            {screwCount > 0 && (
              <span className="ml-2 text-sky-600">· {screwCount} fasteners</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
