const fs = require("fs");
const path = require("path");

// mockData.ts 파일 읽기
const filePath = path.join(
  __dirname,
  "src/app/github-actions-flow/constants/mockData.ts"
);
let content = fs.readFileSync(filePath, "utf8");

// 파이프라인 데이터에서 step 블록들을 찾아서 job-name 추가
const stepBlockRegex =
  /(\s*{\s*id:\s*"[^"]*",\s*name:\s*"[^"]*",\s*type:\s*"step",\s*domain:\s*"[^"]*",\s*task:\s*\[[^\]]*\],\s*description:\s*[^,]*,\s*)(config:\s*{)/g;

// job-name을 추가한 새로운 내용으로 교체
content = content.replace(stepBlockRegex, '$1"job-name": "ci-pipeline",\n$2');

// 수정된 내용을 파일에 저장
fs.writeFileSync(filePath, content, "utf8");

console.log("✅ 모든 step 블록들에 job-name이 추가되었습니다!");
