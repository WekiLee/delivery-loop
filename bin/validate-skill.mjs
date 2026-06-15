#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const skillPath = path.join(rootDir, "SKILL.md");
const openaiYamlPath = path.join(rootDir, "agents", "openai.yaml");
const installPath = path.join(rootDir, "bin", "install.mjs");
const readmePath = path.join(rootDir, "README.md");
const licensePath = path.join(rootDir, "LICENSE");

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
  const license = await readFile(licensePath, "utf8");
  for (const agentName of ["openclaw", "opencode", "hermes"]) {
    if (!installScript.includes(`${agentName}:`)) {
      fail(`安装器缺少 agent 目标：${agentName}`);
    }
    if (!readme.includes(`--agent ${agentName}`)) {
      fail(`README 缺少 agent 示例：${agentName}`);
    }
  }

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
