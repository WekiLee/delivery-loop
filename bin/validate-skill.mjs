#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const skillPath = path.join(rootDir, "SKILL.md");
const openaiYamlPath = path.join(rootDir, "agents", "openai.yaml");
const installPath = path.join(rootDir, "bin", "install.mjs");
const readmePath = path.join(rootDir, "README.md");
const readmeEnPath = path.join(rootDir, "README.en.md");
const licensePath = path.join(rootDir, "LICENSE");

const EXPECTED_AGENT_TARGETS = [
  {
    name: "universal",
    project: [".agents", "skills"],
    global: [".config", "agents", "skills"],
    readmeRow: "| universal | `.agents/skills/delivery-loop` | `~/.config/agents/skills/delivery-loop` |",
    readmeEnRow: "| universal | `.agents/skills/delivery-loop` | `~/.config/agents/skills/delivery-loop` |",
    hasAutoExamples: false,
  },
  {
    name: "codex",
    project: [".agents", "skills"],
    global: [".codex", "skills"],
    readmeRow: "| codex | `.agents/skills/delivery-loop` | `~/.codex/skills/delivery-loop` |",
    readmeEnRow: "| codex | `.agents/skills/delivery-loop` | `~/.codex/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "claude-code",
    project: [".claude", "skills"],
    global: [".claude", "skills"],
    readmeRow: "| claude-code | `.claude/skills/delivery-loop` | `~/.claude/skills/delivery-loop` |",
    readmeEnRow: "| claude-code | `.claude/skills/delivery-loop` | `~/.claude/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "gemini",
    project: [".gemini", "skills"],
    global: [".gemini", "skills"],
    readmeRow: "| gemini | `.gemini/skills/delivery-loop` | `~/.gemini/skills/delivery-loop` |",
    readmeEnRow: "| gemini | `.gemini/skills/delivery-loop` | `~/.gemini/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "windsurf",
    project: [".windsurf", "skills"],
    global: [".codeium", "windsurf", "skills"],
    readmeRow: "| windsurf | `.windsurf/skills/delivery-loop` | `~/.codeium/windsurf/skills/delivery-loop` |",
    readmeEnRow: "| windsurf | `.windsurf/skills/delivery-loop` | `~/.codeium/windsurf/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "goose",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
    readmeRow: "| goose | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    readmeEnRow: "| goose | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "openclaw",
    project: ["skills"],
    global: [".openclaw", "skills"],
    readmeRow: "| openclaw | `skills/delivery-loop` | `~/.openclaw/skills/delivery-loop` |",
    readmeEnRow: "| openclaw | `skills/delivery-loop` | `~/.openclaw/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "opencode",
    project: [".opencode", "skills"],
    global: [".config", "opencode", "skills"],
    readmeRow: "| opencode | `.opencode/skills/delivery-loop` | `~/.config/opencode/skills/delivery-loop` |",
    readmeEnRow: "| opencode | `.opencode/skills/delivery-loop` | `~/.config/opencode/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "hermes",
    project: null,
    global: [".hermes", "skills"],
    readmeRow: "| hermes | 需通过 Hermes 外部目录配置或 `--target` 指定 | `~/.hermes/skills/delivery-loop` |",
    readmeEnRow: "| hermes | Configure an external Hermes directory or specify `--target` | `~/.hermes/skills/delivery-loop` |",
    hasAutoExamples: true,
    exampleScopes: ["global"],
  },
  {
    name: "mimocode",
    project: [".mimocode", "skills"],
    global: [".config", "mimocode", "skills"],
    readmeRow: "| mimocode / mimo | `.mimocode/skills/delivery-loop` | `~/.config/mimocode/skills/delivery-loop` |",
    readmeEnRow: "| mimocode / mimo | `.mimocode/skills/delivery-loop` | `~/.config/mimocode/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "mimo",
    project: [".mimocode", "skills"],
    global: [".config", "mimocode", "skills"],
    readmeRow: "| mimocode / mimo | `.mimocode/skills/delivery-loop` | `~/.config/mimocode/skills/delivery-loop` |",
    readmeEnRow: "| mimocode / mimo | `.mimocode/skills/delivery-loop` | `~/.config/mimocode/skills/delivery-loop` |",
    hasAutoExamples: true,
  },
  {
    name: "cursor",
    project: [".agents", "skills"],
    global: [".cursor", "skills"],
    readmeRow: "| cursor / cursors | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |",
    readmeEnRow: "| cursor / cursors | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |",
    hasAutoExamples: true,
    exampleScopes: ["global"],
  },
  {
    name: "cursors",
    project: [".agents", "skills"],
    global: [".cursor", "skills"],
    readmeRow: "| cursor / cursors | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |",
    readmeEnRow: "| cursor / cursors | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |",
    hasAutoExamples: true,
    exampleScopes: ["global"],
  },
  {
    name: "aider",
    project: null,
    global: null,
    readmeRow: "| aider | 需手动配置或用 `--target` 指定 | 需手动配置或用 `--target` 指定 |",
    readmeEnRow: "| aider | Configure manually or specify `--target` | Configure manually or specify `--target` |",
    hasAutoExamples: false,
  },
  {
    name: "cline",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
    readmeRow: "| cline | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    readmeEnRow: "| cline | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    hasAutoExamples: false,
  },
  {
    name: "zed",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
    readmeRow: "| zed | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    readmeEnRow: "| zed | `.agents/skills/delivery-loop` | `~/.agents/skills/delivery-loop` |",
    hasAutoExamples: false,
  },
];

function fail(message) {
  console.error(`校验失败：${message}`);
  process.exit(1);
}

function parseSimpleFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    fail("SKILL.md 缺少 YAML frontmatter");
  }

  const endIndex = content.indexOf("\n---", 4);
  if (endIndex === -1) {
    fail("SKILL.md frontmatter 未正确闭合");
  }

  const fields = {};
  const frontmatter = content.slice(4, endIndex);
  for (const rawLine of frontmatter.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      fail(`frontmatter 行格式不正确：${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return fields;
}

function formatInstallArray(parts) {
  if (!parts) {
    return "null";
  }
  return `[${parts.map((part) => `"${part}"`).join(", ")}]`;
}

function extractAgentTargetsSection(installScript) {
  const startMarker = "const AGENT_TARGETS = {";
  const startIndex = installScript.indexOf(startMarker);
  if (startIndex === -1) {
    fail("安装器缺少 AGENT_TARGETS 配置表");
  }

  const endIndex = installScript.indexOf("\n};", startIndex);
  if (endIndex === -1) {
    fail("安装器 AGENT_TARGETS 配置表未正确闭合");
  }

  return installScript.slice(startIndex, endIndex);
}

function collectAgentTargetNames(installScript) {
  const targetsSection = extractAgentTargetsSection(installScript);
  const names = [];
  const agentEntryPattern = /^  (?:"([^"]+)"|([A-Za-z0-9_-]+)): \{$/gm;
  for (const match of targetsSection.matchAll(agentEntryPattern)) {
    names.push(match[1] ?? match[2]);
  }
  return names;
}

function extractAgentBlock(installScript, agentName) {
  const markers = [`  ${agentName}: {`, `  "${agentName}": {`];
  const startIndex = markers
    .map((marker) => installScript.indexOf(marker))
    .find((index) => index !== -1);
  if (startIndex === undefined) {
    fail(`安装器缺少 agent 目标：${agentName}`);
  }

  const endIndex = installScript.indexOf("\n  },", startIndex);
  if (endIndex === -1) {
    fail(`安装器 agent 配置块未正确闭合：${agentName}`);
  }

  return installScript.slice(startIndex, endIndex);
}

function validateAgentTargetDocs(installScript, readme, readmeEn) {
  const actualAgentNames = collectAgentTargetNames(installScript).sort();
  const expectedAgentNames = EXPECTED_AGENT_TARGETS.map((target) => target.name).sort();
  if (actualAgentNames.join(",") !== expectedAgentNames.join(",")) {
    fail(`安装器目标表与校验目标表不一致：安装器=${actualAgentNames.join(", ")}；校验=${expectedAgentNames.join(", ")}`);
  }

  for (const target of EXPECTED_AGENT_TARGETS) {
    const agentBlock = extractAgentBlock(installScript, target.name);

    for (const [scope, parts] of [["project", target.project], ["global", target.global]]) {
      const expectedSnippet = `${scope}: ${formatInstallArray(parts)}`;
      if (!agentBlock.includes(expectedSnippet)) {
        fail(`安装器 ${target.name} 的 ${scope} 路径不符合预期：${expectedSnippet}`);
      }
    }

    if (!readme.includes(target.readmeRow)) {
      fail(`README 目标路径表缺少或不匹配：${target.name}`);
    }
    if (!readmeEn.includes(target.readmeEnRow)) {
      fail(`README.en 目标路径表缺少或不匹配：${target.name}`);
    }

    const exampleScopes = target.exampleScopes ?? ["global", "project"];
    for (const scope of ["global", "project"]) {
      const example = `--${scope} --agent ${target.name}`;
      if (target.hasAutoExamples && exampleScopes.includes(scope) && !readme.includes(example)) {
        fail(`README 缺少 agent 示例：${target.name} ${scope}`);
      }
      if (target.hasAutoExamples && exampleScopes.includes(scope) && !readmeEn.includes(example)) {
        fail(`README.en 缺少 agent 示例：${target.name} ${scope}`);
      }
      if ((!target.hasAutoExamples || !exampleScopes.includes(scope)) && readme.includes(example)) {
        fail(`README 不应提供自动安装示例：${target.name} ${scope}`);
      }
      if ((!target.hasAutoExamples || !exampleScopes.includes(scope)) && readmeEn.includes(example)) {
        fail(`README.en 不应提供自动安装示例：${target.name} ${scope}`);
      }
    }
  }

  if (!readme.includes("Aider 未提供官方 skills 自动发现目录")) {
    fail("README 缺少 Aider 手动配置说明");
  }
  if (!readmeEn.includes("Aider does not provide an official skills auto-discovery directory")) {
    fail("README.en 缺少 Aider 手动配置说明");
  }
}

async function validateSkill() {
  if (!existsSync(skillPath)) {
    fail("未找到 SKILL.md");
  }

  const content = await readFile(skillPath, "utf8");
  const fields = parseSimpleFrontmatter(content);
  const allowedKeys = new Set(["name", "description"]);
  for (const key of Object.keys(fields)) {
    if (!allowedKeys.has(key)) {
      fail(`SKILL.md frontmatter 存在非预期字段：${key}`);
    }
  }

  if (fields.name !== "delivery-loop") {
    fail("skill name 必须为 delivery-loop");
  }

  if (!/^[a-z0-9-]+$/.test(fields.name)) {
    fail("skill name 必须使用小写字母、数字与连字符");
  }

  if (!fields.description || fields.description.length > 1024) {
    fail("description 必须存在且不超过 1024 字符");
  }

  if (/[<>]/.test(fields.description)) {
    fail("description 不允许包含尖括号");
  }

  if (!existsSync(openaiYamlPath)) {
    fail("未找到 agents/openai.yaml");
  }

  const openaiYaml = await readFile(openaiYamlPath, "utf8");
  for (const requiredText of [
    'display_name: "业务需求交付闭环"',
    "short_description:",
    'default_prompt: "使用 $delivery-loop',
    "allow_implicit_invocation: true",
  ]) {
    if (!openaiYaml.includes(requiredText)) {
      fail(`agents/openai.yaml 缺少必要内容：${requiredText}`);
    }
  }

  const installScript = await readFile(installPath, "utf8");
  const readme = await readFile(readmePath, "utf8");
  const readmeEn = await readFile(readmeEnPath, "utf8");
  const license = await readFile(licensePath, "utf8");
  validateAgentTargetDocs(installScript, readme, readmeEn);

  if (!license.includes("MIT License") || !license.includes("Copyright (c) 2026 WekiLee")) {
    fail("LICENSE 缺少 MIT 许可证标题或版权主体");
  }

  if (!readme.includes("## 许可证") || !readme.includes("MIT License")) {
    fail("README 缺少许可证章节");
  }

  console.log("skill 校验通过。");
}

validateSkill().catch((error) => {
  fail(error.message);
});
