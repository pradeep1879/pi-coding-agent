import { runCommand } from "./tools/run-command";
//@ts-ignore
const data = await runCommand("rm");
console.log(data)