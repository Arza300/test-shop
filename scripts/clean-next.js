/* يمسح مجلد .next عندما يتعطل الـ HMR — شغّل: npm run dev:reset */
const fs = require("fs");
const path = require("path");
const nextDir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next");
} catch (e) {
  if (e && e.code !== "ENOENT") throw e;
}
