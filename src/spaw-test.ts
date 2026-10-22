import { runCommand } from "./tools/run-command";

const data = await runCommand("rm");
console.log(data)