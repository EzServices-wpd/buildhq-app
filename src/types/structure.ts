/**
 * BuildHq StructureGraph types — true-to-size stick-based structures
 * Version 0.7.2
 */

export type Vec3 = [number, number, number];

export type NodeId = string;
export type EdgeId = string;

export interface StructureNode {
  id: NodeId;
  position: Vec3;
  role?: 'base' | 'joint' | 'apex' | 'brace' | 'platform' | 'anchor';
  label?: string;
}

export type JointType =
  | 'butt'
  | 'lap'
  | 'miter'
  | 'scarf'
  | 'mortise-tenon'
  | 'half-lap'
  | 'bolt-plate'
  | 'bracket'
  | 'gusset'
  | 'weld-sim' // for metal stick simulation
  | 'clamp';

export interface StructureEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  lengthMm: number;
  profile: MaterialProfile;
  jointAtFrom?: JointType;
  jointAtTo?: JointType;
  role?: 'leg' | 'brace' | 'chord' | 'rung' | 'diagonal' | 'rail' | 'post' | 'beam';
  cutAngleFromDeg?: number;
  cutAngleToDeg?: number;
}

export interface MaterialProfile {
  sku: string;
  name: string;
  section: '2x4' | '2x2' | '1x2' | '1x3' | '1x4' | '4x4' | '2x6' | 'dowel-25' | 'tube-25' | 'tube-38' | 'angle-25' | 'custom';
  material: 'pine' | 'oak' | 'plywood' | 'mdf' | 'aluminum' | 'steel' | 'pvc' | 'bamboo';
  widthMm: number;
  heightMm: number;
  wallMm?: number; // for tubes
  densityKgPerM3?: number;
}

export interface StructureGraph {
  id: string;
  name: string;
  description?: string;
  nodes: StructureNode[];
  edges: StructureEdge[];
  units: 'mm';
  scaleHint?: string; // e.g. "Eiffel 1:50" or "full-size closet"
  boundingBox?: { min: Vec3; max: Vec3 };
  metadata?: Record<string, unknown>;
}

export interface ForgeInstance {
  id: string;
  graphId: string;
  transform: { position: Vec3; rotation: Vec3; scale: number };
  materialOverrides?: Record<EdgeId, MaterialProfile>;
  labels?: Record<string, string>;
}

export interface CutListItem {
  id: string;
  edgeId: EdgeId;
  profile: MaterialProfile;
  lengthMm: number;
  quantity: number;
  cutAngleFromDeg: number;
  cutAngleToDeg: number;
  role?: string;
  notes?: string;
}

export interface JoinSpec {
  nodeId: NodeId;
  edges: EdgeId[];
  jointType: JointType;
  hardware: HardwareItem[];
  notes?: string;
  sequenceOrder: number;
}

export interface HardwareItem {
  sku: string;
  name: string;
  qty: number;
  unit: 'ea' | 'box' | 'pack';
}

export interface BomLine {
  sku: string;
  name: string;
  qty: number;
  unit: string;
  category: 'lumber' | 'hardware' | 'finish' | 'tool' | 'other';
  estimatedCostUsd?: number;
  notes?: string;
}

export interface BuildStep {
  order: number;
  role: string; // e.g. "foundation", "legs", "bracing", "platform", "finish"
  title: string;
  description: string;
  relatedNodeIds: NodeId[];
  relatedEdgeIds: EdgeId[];
  tools?: string[];
  safetyNotes?: string[];
  estimatedMinutes?: number;
}

export interface ForgeReport {
  version: string;
  generatedAt: string;
  graph: StructureGraph;
  instances: ForgeInstance[];
  cutList: CutListItem[];
  joins: JoinSpec[];
  bom: BomLine[];
  steps: BuildStep[];
  totals: {
    totalStickLengthM: number;
    estimatedWeightKg: number;
    estimatedCostUsd: number;
    stepCount: number;
  };
  warnings: string[];
}
