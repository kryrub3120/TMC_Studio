/**
 * Equipment Shape Components Contract
 * 
 * Shape components are PURE VISUALS:
 * - No event handlers inside
 * - All interaction via EquipmentNode hitRect
 * - listening={false} on all internal shapes
 * 
 * Future equipment additions:
 * 1. Create new {type}.tsx file with this contract
 * 2. Add entry to EQUIPMENT_RENDERERS map
 * 3. Add hit bounds to getEquipmentHitBounds()
 * 4. No changes to EquipmentNode.tsx needed
 */
export type EquipmentShapeProps = {
  color: string;
  scale: number;
  variant: string;
};
