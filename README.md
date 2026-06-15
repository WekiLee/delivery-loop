# 业务需求交付闭环 Skill

`delivery-loop` 是一个面向中等复杂度以上业务需求的通用 agent skill，用于把需求从进入、澄清、技术方案、TDD 实现、内部质量门、验收、发布观察推进到结项沉淀。

它遵循开放 agent skills 目录结构：核心入口是 `SKILL.md`，同时提供 `agents/openai.yaml` 作为 OpenAI Codex 的可选界面元数据。该元数据不限制其他 agent 使用本 skill。

## 适用场景

- 用户提供 PRD、issue、需求链接或业务背景，需要拆成可执行交付流程。
- 需要先明确目标行为、非目标边界、验收标准和风险，再进入技术方案。
- 需要把实现、测试、验收证据、发布观察和复盘沉淀串成闭环。

## 使用 npx 安装

已发布到 npm 后，默认安装到当前项目的通用 agent skills 目录：

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

安装后重启或刷新对应 agent，并通过 `$delivery-loop` 调用。

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
└── LICENSE
```

## 验证

```bash
npm run check
npm run validate
npm run pack:dry-run
```

## 许可证

本项目使用 MIT License，详见 [LICENSE](./LICENSE)。

## 参考

- OpenAI Codex Agent Skills 官方文档：https://developers.openai.com/codex/skills
- OpenAI skills catalog：https://github.com/openai/skills
- Vercel Labs skills CLI：https://github.com/vercel-labs/skills
