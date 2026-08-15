"use client";

/**
 * Renders Forge catalog instances in the 3D workspace.
 * Sticks / boards = boxes, tubes / pipes / dowels = cylinders (optionally hollow).
 * Supports select + drag on the XZ plane (Y held unless Shift for height).
 */

import { useRef } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import type { ForgeInstance } from "@/types/project";
import { getCatalogItem } from "@/lib/forge/catalog";
import { toPrimitive, isCylindrical } from "@/lib/forge/geometry";

function ForgePieceMesh({
  instance,
  selected,
  onSelect,
  onMove,
}: {
  instance: ForgeInstance;
  selected: boolean;
  onSelect: () => void;
  onMove?: (pos: { x: number; y: number; z: number }) => void;
}) {
  const item = getCatalogItem(instance.catalogId);
  const dragging = useRef(false);
  const dragStart = useRef({
    mouse: new THREE.Vector3(),
    pos: { x: 0, y: 0, z: 0 },
  });

  if (!item) return null;

  const prim = toPrimitive(item, instance.cutLength);
  const color = item.color ?? "#c4a574";
  const roughness = item.roughness ?? 0.7;
  const metalness = item.metalness ?? 0;
  const rot = instance.rotation ?? { x: 0, y: 0, z: 0 };
  const cylindrical = isCylindrical(item.formFactor);

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    if (!onMove) return;
    dragging.current = true;
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    dragStart.current = {
      mouse: e.point.clone(),
      pos: { ...instance.position },
    };
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !onMove) return;
    e.stopPropagation();
    const delta = e.point.clone().sub(dragStart.current.mouse);
    // Default: slide on ground plane (XZ). Hold Shift to adjust height (Y).
    const next = { ...dragStart.current.pos };
    if (e.nativeEvent.shiftKey) {
      next.y = Math.round((dragStart.current.pos.y + delta.y) * 4) / 4;
      next.y = Math.max(0.1, next.y);
    } else {
      next.x = Math.round((dragStart.current.pos.x + delta.x) * 4) / 4;
      next.z = Math.round((dragStart.current.pos.z + delta.z) * 4) / 4;
    }
    onMove(next);
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    dragging.current = false;
    try {
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const common = {
    onPointerDown: handleDown,
    onPointerMove: handleMove,
    onPointerUp: handleUp,
    onPointerLeave: handleUp,
  };

  if (cylindrical && prim.radius != null) {
    const h = prim.length;
    const r = prim.radius;
    const inner = prim.innerRadius;
    return (
      <group
        position={[instance.position.x, instance.position.y, instance.position.z]}
        rotation={[rot.x, rot.y, rot.z]}
        {...common}
      >
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[r, r, h, 24]} />
          <meshStandardMaterial
            color={selected ? "#6366f1" : color}
            roughness={roughness}
            metalness={metalness}
            emissive={selected ? "#312e81" : "#000000"}
            emissiveIntensity={selected ? 0.15 : 0}
          />
          {selected && <Edges threshold={15} color="#a5b4fc" />}
        </mesh>
        {inner != null && inner > 0.01 && (
          <mesh>
            <cylinderGeometry args={[inner, inner, h + 0.02, 20]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.9}
              side={THREE.BackSide}
            />
          </mesh>
        )}
      </group>
    );
  }

  const sx = prim.length;
  const sy = prim.height;
  const sz = prim.width;

  return (
    <group
      position={[instance.position.x, instance.position.y, instance.position.z]}
      rotation={[rot.x, rot.y, rot.z]}
      {...common}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[sx, sy, sz]} />
        <meshStandardMaterial
          color={selected ? "#6366f1" : color}
          roughness={roughness}
          metalness={metalness}
          emissive={selected ? "#312e81" : "#000000"}
          emissiveIntensity={selected ? 0.15 : 0}
        />
        {selected && <Edges threshold={15} color="#a5b4fc" />}
      </mesh>
    </group>
  );
}

export function ForgePieces({
  instances,
  selectedId,
  onSelect,
  onMove,
}: {
  instances: ForgeInstance[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove?: (id: string, pos: { x: number; y: number; z: number }) => void;
}) {
  if (!instances.length) return null;
  return (
    <>
      {instances.map((inst) => (
        <ForgePieceMesh
          key={inst.id}
          instance={inst}
          selected={inst.id === selectedId}
          onSelect={() => onSelect(inst.id)}
          onMove={onMove ? (pos) => onMove(inst.id, pos) : undefined}
        />
      ))}
    </>
  );
}

/** Invisible ground plane for freehand click-to-place */
export function ForgeGround({
  enabled,
  onPlace,
  size = 200,
}: {
  enabled: boolean;
  onPlace: (point: { x: number; y: number; z: number }) => void;
  size?: number;
}) {
  if (!enabled) return null;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.005, 0]}
      onPointerDown={(e) => {
        // Only place if not already handled by a piece
        if (e.delta > 2) return;
        e.stopPropagation();
        const x = Math.round(e.point.x * 4) / 4;
        const z = Math.round(e.point.z * 4) / 4;
        onPlace({ x, y: 0, z });
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
