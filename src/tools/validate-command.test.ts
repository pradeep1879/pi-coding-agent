import { describe, expect, test } from "bun:test";
import { validateCommand, parseCommand } from "./validate-command";


describe("validateCommand", () => {
test("allows approved commands", () => {
expect(validateCommand("pwd")).toBe(true);
expect(validateCommand("ls")).toBe(true);
expect(validateCommand("ls -la")).toBe(true);
expect(validateCommand("git status")).toBe(true);
expect(validateCommand("git diff --stat")).toBe(true);
expect(validateCommand("git log --oneline")).toBe(true);
expect(validateCommand("bun test")).toBe(true);
});

test("rejects dangerous or unapproved commands", () => {
expect(validateCommand("rm -rf .")).toBe(false);
expect(validateCommand("git push")).toBe(false);
expect(validateCommand("git reset --hard")).toBe(false);
expect(validateCommand("bun install")).toBe(false);
expect(validateCommand("npm install")).toBe(false);
});

test("rejects shell operators", () => {
expect(validateCommand("ls && rm -rf .")).toBe(false);
expect(validateCommand("pwd; ls")).toBe(false);
expect(validateCommand("ls | cat")).toBe(false);
expect(validateCommand("ls > output.txt")).toBe(false);
expect(validateCommand("cat $(whoami)")).toBe(false);
});

test("rejects paths outside the project", () => {
expect(validateCommand("cat /etc/passwd")).toBe(false);
expect(validateCommand("ls ../../")).toBe(false);
});

test("rejects unsupported arguments", () => {
expect(validateCommand("ls --recursive")).toBe(false);
expect(validateCommand("cat -n package.json")).toBe(false);
expect(validateCommand("git log --all")).toBe(false);
expect(validateCommand("pwd extra")).toBe(false);
});

test("parses approved commands", () => {
expect(parseCommand("git log --oneline")).toEqual([
"git",
"log",
"--oneline",
]);

expect(parseCommand("ls -la")).toEqual(["ls", "-la"]);
expect(parseCommand("rm -rf .")).toBeNull();
});

test("handles whitespace", () => {
expect(validateCommand("  git   status  ")).toBe(true);
expect(validateCommand("")).toBe(false);
expect(validateCommand("   ")).toBe(false);
});
});