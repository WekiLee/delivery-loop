# 业务需求交付闭环 Skill

语言：简体中文 | [English](./README.en.md)

`delivery-loop` 是一个面向中等复杂度以上业务需求的通用 agent skill。它把需求从进入、澄清、技术方案、TDD 实现、内部质量门、验收、发布观察推进到结项沉淀，目标是让一次需求交付有明确输入、可审查产物、可验证结果和可复用经验。

核心入口是 [`SKILL.md`](./SKILL.md)。仓库同时提供 `agents/openai.yaml` 作为 OpenAI Codex 的可选界面元数据，不限制其他 agent 使用本 skill。

## 什么时候使用

适合使用 `delivery-loop` 的情况：

- 用户提供 PRD、issue、需求链接、业务背景或一段模糊需求，需要拆成可执行交付流程。
- 需要先明确目标行为、非目标边界、验收标准和风险，再进入技术方案。
- 需要把实现、测试、验收证据、发布观察和复盘沉淀串成闭环。
- 需求涉及多人协作、配置变更、灰度发布、验收留痕或长期知识沉淀。

不建议使用完整流程的情况：

- 只改 typo、单行配置或明显的小 bug。
- 用户只想要一个快速解释、代码片段或局部 review。
- 紧急线上问题需要先止血。此时应先修复和验证，事后再补齐复盘沉淀。

## 30 秒开始

在目标项目中安装：

```bash
npx delivery-loop --project --agent codex
```

重启或刷新对应 agent 后，在对话中触发：

```text
$delivery-loop
请按业务需求交付闭环处理这个需求：
<粘贴 PRD、issue、需求链接或业务背景>
```

如果你的 agent 不支持 `$skill-name` 形式，可以直接说明：

```text
请使用 delivery-loop skill，先完成需求澄清和验收标准，不要直接写代码。
需求如下：
<需求内容>
```

## 如何触发

推荐显式触发，避免 agent 把中等复杂度需求当成普通问答处理：

```text
$delivery-loop 帮我拆解这个 PRD，并输出 requirements 文档。
```

也可以用自然语言触发：

```text
这个需求要从需求澄清、技术方案、实现、验收到发布观察走完整闭环。
```

当用户提到以下意图时，本 skill 也适合介入：

- “帮我做需求分析”
- “把这个需求拆成可执行方案”
- “先别写代码，先明确验收标准”
- “需要一套从实现到发布验收的闭环流程”
- “帮我做业务需求专家 Agent 流程”

## 你需要提供什么

最小输入只需要一段需求描述，但输入越完整，澄清轮次越少。推荐提供：

- 需求背景：为什么要做，解决谁的问题。
- 目标行为：用户或系统最终应该发生什么变化。
- 非目标边界：明确哪些不做，避免范围蔓延。
- 验收方式：希望通过哪些测试、日志、接口、监控或人工验收确认。
- 约束条件：时间、兼容性、配置平台、发布窗口、依赖服务、风险偏好。
- 现有材料：PRD、issue、设计稿、接口文档、历史缺陷、相关代码路径。

可直接复制的输入模板：

```text
$delivery-loop
需求背景：
<说明业务背景>

目标行为：
<说明用户或系统应该看到的变化>

非目标：
<说明本次不做什么>

验收标准：
<列出可验证标准；不确定可写“请帮我补齐”>

约束与风险：
<时间、兼容性、配置、发布、依赖等限制>

相关材料：
<PRD、issue、链接、代码路径或日志>
```

## skill 会如何工作

`delivery-loop` 会按八阶段推进。每个阶段都以前一阶段产物为基准，质量门未通过时不进入下一阶段。

| 阶段 | 目标 | 关键产物 |
| --- | --- | --- |
| 需求进入 | 汇总当前需求材料与历史上下文 | 初始上下文快照 |
| 需求澄清 | 把模糊需求变成可审阅 requirements | 目标行为、非目标、验收标准、风险、待确认问题 |
| 技术方案 | 明确怎么实现与怎么验证 | Technical Plan、影响范围、测试策略、回滚策略 |
| TDD 实现 | 先用测试定义正确行为，再实现 | 测试、实现代码、小步提交 |
| 内部质量门 | 自动检查实现质量 | diff-to-test 映射、lint/静态检查、内部 review |
| 验收 | 证明需求做对了 | 测试输出、接口结果、日志、监控、配置状态 |
| 发布观察 | 灰度与上线后确认 | 监控结论、异常处理、回滚记录 |
| 结项沉淀 | 把经验转成长期能力 | 业务知识、流程改进、归档材料 |

## 使用中的协作规则

- 在 requirements 确认前，不进入技术方案或编码。
- 在 technical plan 确认前，不进入实现。
- 行为变化需要有测试或可审计验收证据。
- 配置类需求要在方案阶段确认 schema、默认值、灰度策略和生效方式。
- 验收证据应沉淀到项目记录中，不只留在对话里。
- 结项时要区分稳定业务知识、流程改进和一次性材料，避免把临时上下文写进长期知识库。

## 示例用法

需求澄清：

```text
$delivery-loop
这是一个会员续费提醒需求。请先输出 requirements，列出目标行为、非目标、验收标准和待确认问题，不要写代码。
<粘贴需求内容>
```

技术方案：

```text
$delivery-loop
requirements 已确认。请基于以下内容输出 technical plan，重点说明影响范围、测试策略、配置依赖和回滚方案。
<粘贴已确认的 requirements>
```

实现与验收：

```text
$delivery-loop
technical plan 已确认。请按 TDD 推进实现，先补测试，再改代码，并在完成后输出验收证据清单。
<粘贴 plan 或引用本地文件路径>
```

结项沉淀：

```text
$delivery-loop
需求已发布观察完成。请复盘本次交付，把稳定业务知识、流程改进和一次性归档材料分开整理。
<粘贴验收和发布观察记录>
```

## 安装方式

默认安装到当前项目的通用 agent skills 目录：

```bash
npx delivery-loop
```

默认目标：

```text
.agents/skills/delivery-loop
```

安装到指定 agent 的全局目录：

```bash
npx delivery-loop --global --agent codex
npx delivery-loop --global --agent claude-code
npx delivery-loop --global --agent cursor
npx delivery-loop --global --agent openclaw
npx delivery-loop --global --agent opencode
npx delivery-loop --global --agent hermes
```

安装到指定 agent 的项目目录：

```bash
npx delivery-loop --project --agent codex
npx delivery-loop --project --agent claude-code
npx delivery-loop --project --agent openclaw
npx delivery-loop --project --agent opencode
```

常用目标路径：

| agent | 项目目录 | 全局目录 |
| --- | --- | --- |
| universal | `.agents/skills/delivery-loop` | `~/.config/agents/skills/delivery-loop` |
| codex | `.agents/skills/delivery-loop` | `~/.codex/skills/delivery-loop` |
| claude-code | `.claude/skills/delivery-loop` | `~/.claude/skills/delivery-loop` |
| cursor | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |
| openclaw | `skills/delivery-loop` | `~/.openclaw/skills/delivery-loop` |
| opencode | `.opencode/skills/delivery-loop` | `~/.config/opencode/skills/delivery-loop` |
| hermes | 需通过 Hermes 外部目录配置或 `--target` 指定 | `~/.hermes/skills/delivery-loop` |

查看当前安装器支持的 agent 路径：

```bash
npx delivery-loop --list-agents
```

如果你的 agent 使用其他目录，可直接指定最终 skill 目录：

```bash
npx delivery-loop --target ./vendor/skills/delivery-loop
```

从 GitHub 仓库直接使用 npm 的 git 规格安装：

```bash
npx github:WekiLee/delivery-loop
```

也可以使用开放 agent skills CLI 从 GitHub 安装：

```bash
npx skills add WekiLee/delivery-loop -a codex -g
npx skills add WekiLee/delivery-loop -a claude-code -g
npx skills add WekiLee/delivery-loop -a openclaw -g
npx skills add WekiLee/delivery-loop -a opencode -g
```

项目地址：https://github.com/WekiLee/delivery-loop

## 本地开发与验证

```bash
npm run check
npm run validate
npm run pack:dry-run
```

命令含义：

- `npm run check`：检查安装脚本和校验脚本语法。
- `npm run validate`：校验 `SKILL.md` 的 frontmatter、名称、描述和主体内容。
- `npm run pack:dry-run`：确认 npm 包会包含预期文件。

## 项目结构

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── bin/
│   ├── install.mjs
│   └── validate-skill.mjs
├── package.json
├── README.md
├── README.en.md
└── LICENSE
```

## 许可证

本项目使用 MIT License，详见 [LICENSE](./LICENSE)。
