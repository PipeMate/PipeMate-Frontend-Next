export type PathSeg = string | number;

export const getAtPath = (root: any, path: PathSeg[]): any => {
  let cur = root;
  for (const seg of path) {
    if (cur == null) return undefined;
    cur = typeof seg === 'number' ? cur?.[seg] : cur?.[seg as keyof typeof cur];
  }
  return cur;
};

export const setAtPath = (root: any, path: PathSeg[], value: unknown): any => {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  const clone = Array.isArray(root) ? [...root] : { ...(root || {}) };
  const nextContainer = Array.isArray(clone) ? clone : (clone as Record<string, unknown>);
  const current = getAtPath(clone, [head]);
  if (tail.length === 0) {
    (nextContainer as any)[head as any] = value;
    return clone;
  }
  const child = current == null ? (typeof tail[0] === 'number' ? [] : {}) : current;
  (nextContainer as any)[head as any] = setAtPath(child, tail, value);
  return clone;
};

export const deleteAtPath = (root: any, path: PathSeg[]): any => {
  if (path.length === 0) return root;
  const [head, ...tail] = path;
  const clone = Array.isArray(root) ? [...root] : { ...(root || {}) };
  if (tail.length === 0) {
    if (Array.isArray(clone) && typeof head === 'number') {
      clone.splice(head, 1);
    } else if (!Array.isArray(clone)) {
      delete (clone as any)[head as any];
    }
    return clone;
  }
  const cur = getAtPath(clone, [head]);
  if (cur == null) return clone;
  (clone as any)[head as any] = deleteAtPath(cur, tail);
  return clone;
};

export const renameKey = (
  root: any,
  parentPath: PathSeg[],
  oldKey: string,
  newKey: string,
): any => {
  const parent = getAtPath(root, parentPath);
  const parentClone = { ...(parent || {}) } as Record<string, unknown>;
  if (oldKey in parentClone) {
    const val = parentClone[oldKey];
    delete parentClone[oldKey];
    if (newKey in parentClone) throw new Error('duplicate_key');
    parentClone[newKey] = val;
  }
  return setAtPath(root, parentPath, parentClone);
};

export const ensureObjectAt = (root: any, path: PathSeg[]): any => {
  const current = getAtPath(root, path);
  if (current && typeof current === 'object' && !Array.isArray(current)) return root;
  return setAtPath(root, path, {});
};

export const ensureArrayAt = (root: any, path: PathSeg[]): any => {
  const current = getAtPath(root, path);
  if (Array.isArray(current)) return root;
  return setAtPath(root, path, []);
};

export interface FieldNode {
  key: string;
  value: string | object | string[];
  type: 'string' | 'object' | 'array';
  isExpanded?: boolean;
  children?: FieldNode[];
  path: PathSeg[];
}

export const buildFieldsFromJson = (
  obj: any,
  parentPath: PathSeg[] = [],
): FieldNode[] => {
  const fields: FieldNode[] = [];
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fields;
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      fields.push({
        key: k,
        value: v as string[],
        type: 'array',
        isExpanded: true,
        path: [...parentPath, k],
      });
    } else if (v && typeof v === 'object') {
      fields.push({
        key: k,
        value: v as object,
        type: 'object',
        isExpanded: true,
        children: buildFieldsFromJson(v, [...parentPath, k]),
        path: [...parentPath, k],
      });
    } else {
      fields.push({
        key: k,
        value: (v ?? '') as string,
        type: 'string',
        isExpanded: true,
        path: [...parentPath, k],
      });
    }
  }
  return fields;
};

export const pathToKey = (path: PathSeg[]): string => path.map(String).join('/');
