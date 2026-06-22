#!/usr/bin/env node

import { cp, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_NAME = "delivery-loop";
const PAYLOAD_ENTRIES = ["SKILL.md", "agents", "assets", "references", "scripts"];
const AGENT_TARGETS = {
  universal: {
    label: "通用 Agent Skills",
    project: [".agents", "skills"],
    global: [".config", "agents", "skills"],
  },
  codex: {
    label: "OpenAI Codex",
    project: [".agents", "skills"],
    global: [".codex", "skills"],
  },
  "claude-code": {
    label: "Claude Code",
    project: [".claude", "skills"],
    global: [".claude", "skills"],
  },
  gemini: {
    label: "Gemini CLI",
    project: [".gemini", "skills"],
    global: [".gemini", "skills"],
  },
  cursor: {
    label: "Cursor",
    project: [".agents", "skills"],
    global: [".cursor", "skills"],
  },
  cursors: {
    label: "Cursor (Cursors 别名)",
    project: [".agents", "skills"],
    global: [".cursor", "skills"],
  },
  openclaw: {
    label: "OpenClaw",
    project: ["skills"],
    global: [".openclaw", "skills"],
  },
  opencode: {
    label: "OpenCode",
    project: [".opencode", "skills"],
    global: [".config", "opencode", "skills"],
  },
  hermes: {
    label: "Hermes",
    project: null,
    global: [".hermes", "skills"],
  },
  windsurf: {
    label: "Windsurf",
    project: [".windsurf", "skills"],
    global: [".codeium", "windsurf", "skills"],
  },
  aider: {
    label: "Aider（需手动配置）",
    project: null,
    global: null,
  },
  goose: {
    label: "Goose",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
  },
  mimocode: {
    label: "MiMo Code",
    project: [".mimocode", "skills"],
    global: [".config", "mimocode", "skills"],
  },
  mimo: {
    label: "MiMo Code（mimocode 别名）",
    project: [".mimocode", "skills"],
    global: [".config", "mimocode", "skills"],
  },
  cline: {
    label: "Cline",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
  },
  zed: {
    label: "Zed",
    project: [".agents", "skills"],
    global: [".agents", "skills"],
  },
};

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function supportedAgentsText() {
  return Object.entries(AGENT_TARGETS)
    .map(([name, config]) => `${name}（${config.label}）`)
    .join("、");
}

function printHelp() {
  console.log(`业务需求交付闭环 skill 安装器

用法：
  npx delivery-loop [选项]

默认行为：
  安装到当前项目的通用目录 .agents/skills/${SKILL_NAME}

选项：
  --agent <name>  目标 agent：${supportedAgentsText()}
  --project       安装到当前项目目录（默认）
  --global        安装到所选 agent 的全局目录
  --target <dir>  安装到指定的最终 skill 目录
  --dry-run       仅打印目标路径，不复制文件
  --list-agents   显示支持的 agent 路径
  -h, --help      显示帮助

示例：
  npx delivery-loop
  npx delivery-loop --global --agent codex
  npx delivery-loop --global --agent claude-code
  npx delivery-loop --project --agent opencode
  npx delivery-loop --project --agent openclaw
  npx delivery-loop --global --agent hermes
  npx delivery-loop --target ./vendor/skills/${SKILL_NAME}
`);
}

function printAgents() {
  console.log("支持的 agent 安装目标：");
  for (const [name, config] of Object.entries(AGENT_TARGETS)) {
    console.log(`- ${name}：${config.label}`);
    if (config.project) {
      console.log(`  项目目录：${path.join(...config.project, SKILL_NAME)}`);
    } else {
      console.log("  项目目录：未提供官方自动发现路径，请使用 --target");
    }
    if (config.global) {
      console.log(`  全局目录：${path.join("~", ...config.global, SKILL_NAME)}`);
    } else {
      console.log("  全局目录：未提供官方自动发现路径，请使用 --target");
    }
  }
}

function parseArgs(argv) {
  const options = {
    agent: "universal",
    scope: "project",
    target: null,
    dryRun: false,
    listAgents: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--agent") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--agent 需要提供 agent 名称");
      }
      options.agent = value;
      index += 1;
    } else if (arg === "--global") {
      options.scope = "global";
    } else if (arg === "--project") {
      options.scope = "project";
    } else if (arg === "--target") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--target 需要提供目录路径");
      }
      options.target = value;
      index += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--list-agents") {
      options.listAgents = true;
    } else if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else {
      throw new Error(`未知参数：${arg}`);
    }
  }

  return options;
}

function resolveTarget(options) {
  if (options.target) {
    return path.resolve(process.cwd(), options.target);
  }

  const agentConfig = AGENT_TARGETS[options.agent];
  if (!agentConfig) {
    throw new Error(`不支持的 agent：${options.agent}。可选值：${Object.keys(AGENT_TARGETS).join(", ")}`);
  }

  const baseDir = options.scope === "global" ? os.homedir() : process.cwd();
  const targetParts = options.scope === "global" ? agentConfig.global : agentConfig.project;
  if (!targetParts) {
    const scopeText = options.scope === "global" ? "全局" : "项目级";
    const fallback = agentConfig.global && options.scope !== "global"
      ? `请使用 --global --agent ${options.agent}，或用 --target 指定已配置目录。`
      : "请用 --target 指定已配置目录，或按该 agent 的官方文档手动配置。";
    throw new Error(`${agentConfig.label} 未提供官方${scopeText}自动发现目录。${fallback}`);
  }
  return path.join(baseDir, ...targetParts, SKILL_NAME);
}

async function copyPayload(targetDir) {
  await mkdir(targetDir, { recursive: true });

  for (const entry of PAYLOAD_ENTRIES) {
    const source = path.join(rootDir, entry);
    if (!existsSync(source)) {
      continue;
    }

    const destination = path.join(targetDir, entry);
    const info = await stat(source);
    if (info.isDirectory()) {
      await cp(source, destination, { recursive: true, force: true });
    } else {
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(source, destination, { force: true });
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (options.listAgents) {
    printAgents();
    return;
  }

  const targetDir = resolveTarget(options);
  console.log(`skill 名称：${SKILL_NAME}`);
  console.log(`目标 agent：${options.agent}`);
  console.log(`安装范围：${options.scope === "global" ? "全局" : "项目"}`);
  console.log(`安装目标：${targetDir}`);

  if (options.dryRun) {
    console.log("dry-run：未复制任何文件。");
    return;
  }

  await copyPayload(targetDir);
  console.log(`安装完成。重启或刷新对应 agent 后即可通过 $${SKILL_NAME} 调用。`);
}

main().catch((error) => {
  console.error(`安装失败：${error.message}`);
  process.exitCode = 1;
});
