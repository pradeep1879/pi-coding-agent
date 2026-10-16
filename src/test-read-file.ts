// This file is only for testing purpose

import { readFileTool } from "./tools/read-file.js";

async function main() {
  const content = await readFileTool("src/index.ts");
  console.log(content);
}

main().catch(console.error);