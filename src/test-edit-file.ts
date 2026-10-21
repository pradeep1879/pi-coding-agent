import { editFileTool } from "./tools/edit-file.js";

const result = await editFileTool(
  "agent-test.txt",
  "Hello from my-pi!",
  "Hello from edit_file!",
);

console.log(result);