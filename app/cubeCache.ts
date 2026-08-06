export type CubeVisualIdentity = {
  id: string;
  label: string;
};

export function cubeVisualSignature(item: CubeVisualIdentity) {
  return `${item.id}\u0000${item.label}`;
}
