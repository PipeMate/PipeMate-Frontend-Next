import fs from 'fs';
import path from 'path';

// 표준화 전략
// - 대상: src/**/*.ts, src/**/*.tsx 의 "한 줄 전체가 주석인" 라인만 처리 (inline 주석은 건드리지 않음)
// - 형태: // *, // !, // ?
// - 분류 규칙(대소문자 무시)
//   !: fixme, bug, hack, important, critical, security, warn, warning, deprecated
//   ?: todo, question, why, how, review, check, verify, investigate, tbd
//   *: note, info, docs, summary, explanation, context, usage, example (기본값 포함)
// - 이미 // *, // !, // ? 형태면 유지하며 불필요한 공백만 정리

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');

/** @param {string} filePath */
function shouldProcessFile(filePath) {
  if (!filePath.startsWith(srcDir)) return false;
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

/** @param {string} comment */
function classifyComment(comment) {
  const text = comment.trim().toLowerCase();

  const important = [
    'fixme',
    'bug',
    'hack',
    'important',
    'critical',
    'security',
    'warn',
    'warning',
    'deprecated',
  ];
  const question = [
    'todo',
    'question',
    'why',
    'how',
    'review',
    'check',
    'verify',
    'investigate',
    'tbd',
  ];
  const general = [
    'note',
    'info',
    'docs',
    'summary',
    'explanation',
    'context',
    'usage',
    'example',
  ];

  const includesAny = (arr) => arr.some((k) => text.includes(k));

  if (includesAny(important)) return '!';
  if (includesAny(question)) return '?';
  if (includesAny(general)) return '*';
  return '*';
}

/** @param {string} content */
function processFileContent(content) {
  const lines = content.split(/\r?\n/);
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 전체 라인이 주석인지 검사 (/// 제외)
    const match = line.match(/^(\s*)\/\/(?!\/)(.*)$/);
    if (!match) continue;

    const leading = match[1] ?? '';
    const body = (match[2] ?? '').trim();

    // 장식형(구분선) 주석 제거: 알파벳/숫자 없이 구분 문자인 경우 삭제
    const decorativeOnly = (text) => {
      const t = text.replace(/\s+/g, '');
      if (t.length < 2) return false;
      return /^[=~*#\/\-_,.<>+|!?:;]+$/.test(t);
    };

    // 이미 // *, // !, // ? 형태면: 장식형이면 제거, 아니면 최소 정규화만 수행
    if (body.startsWith('* ') || body.startsWith('! ') || body.startsWith('? ')) {
      const raw = body.slice(2).trim();
      if (decorativeOnly(raw)) {
        lines[i] = '';
        changed = true;
        continue;
      }
      const normalized = body.replace(/^(\*|!|\?)\s+/, (_, m) => `${m} `);
      const nextLine = `${leading}// ${normalized}`;
      if (nextLine !== line) {
        lines[i] = nextLine;
        changed = true;
      }
      continue;
    }

    // 트리플 슬래시(///) 혹은 JSDoc 전개 등은 제외
    if (line.trim().startsWith('///') || line.trim().startsWith('/**')) continue;

    // 비표준 라인: 장식형이면 제거, 아니면 분류 후 접두 추가
    if (decorativeOnly(body)) {
      lines[i] = '';
      changed = true;
    } else {
      const marker = classifyComment(body);
      const nextLine = `${leading}// ${marker} ${body}`;
      if (nextLine !== line) {
        lines[i] = nextLine;
        changed = true;
      }
    }
  }

  return { content: lines.join('\n'), changed };
}

/** @param {string} dir */
function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // skip dotfiles/directories
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

let updatedFiles = 0;
let updatedLines = 0;

for (const filePath of walk(srcDir)) {
  if (!shouldProcessFile(filePath)) continue;
  const original = fs.readFileSync(filePath, 'utf8');
  const { content, changed } = processFileContent(original);
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedFiles += 1;
    // 대략적인 변경 라인 수 추정 (diff 계산 대신 간단 비교)
    const o = original.split(/\r?\n/);
    const n = content.split(/\r?\n/);
    for (let i = 0; i < Math.min(o.length, n.length); i++) {
      if (o[i] !== n[i]) updatedLines += 1;
    }
  }
}

console.log(`comments standardized: files=${updatedFiles}, lines~=${updatedLines}`);
