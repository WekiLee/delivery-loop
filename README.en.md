# Business Requirement Delivery Loop Skill

Language: [简体中文](./README.md) | English

`delivery-loop` is a general-purpose agent skill for medium-complexity and high-complexity business requirements. It moves a requirement through intake, clarification, technical planning, TDD implementation, internal quality gates, acceptance, release observation, and final knowledge capture. The goal is to make each delivery traceable through clear inputs, reviewable artifacts, verifiable results, and reusable lessons.

The core entry point is [`SKILL.md`](./SKILL.md). This repository also provides `agents/openai.yaml` as optional OpenAI Codex UI metadata. That metadata does not limit use with other agents.

## When to Use

Use `delivery-loop` when:

- The user provides a PRD, issue, requirement link, business context, or vague requirement that needs to become an executable delivery flow.
- You need to define target behavior, non-goals, acceptance criteria, and risks before technical planning.
- You need to connect implementation, tests, acceptance evidence, release observation, and retrospective knowledge capture.
- The requirement involves team collaboration, configuration changes, staged rollout, acceptance records, or long-term knowledge capture.

Do not use the full workflow when:

- The task is only a typo fix, one-line configuration change, or obvious small bug.
- The user only wants a quick explanation, code snippet, or local review.
- A production incident needs immediate mitigation. Fix and verify first, then capture the retrospective afterward.

## 30-Second Start

Install in the target project:

```bash
npx delivery-loop --project --agent codex
```

Restart or refresh the target agent, then trigger it in conversation:

```text
$delivery-loop
Please handle this requirement with the business requirement delivery loop:
<paste the PRD, issue, requirement link, or business context>
```

If your agent does not support the `$skill-name` format, say it directly:

```text
Please use the delivery-loop skill. First clarify requirements and acceptance criteria; do not write code yet.
Requirement:
<requirement content>
```

## How to Trigger

Explicit triggering is recommended so the agent does not treat a medium-complexity requirement as ordinary Q&A:

```text
$delivery-loop Help me break down this PRD and produce a requirements document.
```

You can also trigger it with natural language:

```text
This requirement needs the full loop from requirement clarification and technical planning to implementation, acceptance, and release observation.
```

This skill is also appropriate when the user says things like:

- "Help me analyze this requirement."
- "Turn this requirement into an executable plan."
- "Do not write code yet; define acceptance criteria first."
- "I need a closed-loop process from implementation to release acceptance."
- "Help me build a business requirement expert agent flow."

## What You Should Provide

A short requirement description is enough to start, but richer input reduces clarification rounds. Recommended inputs:

- Background: why this exists and whose problem it solves.
- Target behavior: what users or the system should see after the change.
- Non-goals: what this change explicitly will not do.
- Acceptance method: tests, logs, APIs, monitoring, or manual checks used to confirm success.
- Constraints: timeline, compatibility, configuration platform, release window, dependent services, and risk tolerance.
- Existing material: PRD, issue, design, API docs, historical defects, related code paths, or logs.

Copyable input template:

```text
$delivery-loop
Background:
<describe the business context>

Target behavior:
<describe what users or the system should observe>

Non-goals:
<describe what is out of scope>

Acceptance criteria:
<list verifiable criteria; write "please help me complete this" if unsure>

Constraints and risks:
<timeline, compatibility, configuration, release, dependency, and risk constraints>

Related materials:
<PRD, issue, links, code paths, or logs>
```

## How the Skill Works

`delivery-loop` advances through eight stages. Each stage uses the previous stage's artifacts as the baseline. If a quality gate is not passed, the workflow does not move to the next stage.

| Stage | Goal | Key Artifacts |
| --- | --- | --- |
| Requirement intake | Gather current requirement material and historical context | Initial context snapshot |
| Requirement clarification | Turn a vague requirement into reviewable requirements | Target behavior, non-goals, acceptance criteria, risks, open questions |
| Technical planning | Define how to implement and verify the change | Technical Plan, impact scope, test strategy, rollback strategy |
| TDD implementation | Define correct behavior with tests before implementation | Tests, production changes, small commits |
| Internal quality gate | Automatically check implementation quality | diff-to-test mapping, lint/static checks, internal review |
| Execution evaluation (optional) | Quantify delivery quality | 6-dimension score report (process completeness, artifact quality, implementation correctness, safety compliance, efficiency, iteration capability) |
| Acceptance | Prove the requirement was implemented correctly | Test output, API results, logs, monitoring, configuration state |
| Release observation | Verify staged rollout and post-release behavior | Monitoring conclusion, incident handling, rollback record |
| Final knowledge capture | Turn lessons into long-term capability | Business knowledge, process improvements, archived materials |

## Execution Evaluation: Quantifying Delivery Quality

`delivery-loop` includes an optional execution evaluation step (Step 5.5) that uses a **6-dimension quantitative scoring system** to answer "how well did we do this time?" The evaluation is fully deterministic — it checks whether artifact files exist, whether compilation passes, and whether tests run. Zero LLM judges are involved, and running the same case 3 times produces a hash-identical score.

### When to Trigger

| Timing | Use Case | Output |
|--------|----------|--------|
| After Step 5 quality gate | Daily development, quick feedback | Score brief, aids acceptance judgment |
| During Step 8 closeout | Full retrospective, baseline comparison | Detailed score report, stored in memory |

### Six Scoring Dimensions

| Dimension | Weight | What It Checks |
|-----------|--------|----------------|
| Process completeness | 25% | Whether artifact files for required stages exist (verified via file system, not AI claims) |
| Artifact quality | 25% | Whether requirements/plan contain substantive content, not template filler |
| Implementation correctness | 25% | **Real compilation + real test execution**, never trust self-reports; detects honest gap |
| Safety compliance | 10% | Whether quality gates were skipped; whether configuration issues were only discovered at acceptance |
| Efficiency | 10% | Time spent + tool call count, compared against baseline |
| Iteration capability | 5% | Whether the agent can self-recover from failures (BUILD FAILURE → SUCCESS recovery chain) |

Overall grade: **S (≥90) / A (≥80) / B (≥70) / C (≥60) / D (<60)**.

### How to Use Evaluation

**Option 1: Request directly in conversation**

```text
$delivery-loop
Step 5 quality gate has passed. Please run a 6-dimension quantitative evaluation of this execution cycle.
```

**Option 2: Retrospect at closeout**

```text
$delivery-loop
The requirement has completed release observation. Please retrospect this delivery with a 6-dimension evaluation and write the score report to memory.
```

**Option 3: Use scores to drive workflow improvement**

```text
Current version → Evaluate (6 dimensions) → Identify weaknesses → Modify process/rules → Re-evaluate and compare scores
```

You can have the AI use "high-score configurations" to improve "low-score configurations," generating candidate versions and using deterministic scores to verify whether optimizations are effective. The evaluation template is at [`references/eval-template.md`](references/eval-template.md).

## Collaboration Rules

- Do not enter technical planning or coding before requirements are confirmed.
- Do not enter implementation before the technical plan is confirmed.
- Every behavior change needs tests or auditable acceptance evidence.
- Configuration-related requirements must confirm schema, defaults, rollout strategy, and activation behavior during planning.
- Acceptance evidence should be saved in project records, not only in conversation.
- At closeout, separate stable business knowledge, process improvements, and one-off archived material so temporary context does not pollute long-term knowledge.
- Evaluation scores are hard evidence for process improvement: after each process/rule change, verify with scores whether things improved or worsened, rather than going by intuition.

## Examples

Requirement clarification:

```text
$delivery-loop
This is a membership renewal reminder requirement. First produce requirements with target behavior, non-goals, acceptance criteria, and open questions. Do not write code.
<paste requirement content>
```

Technical planning:

```text
$delivery-loop
The requirements are confirmed. Based on the following content, produce a technical plan focused on impact scope, test strategy, configuration dependencies, and rollback strategy.
<paste confirmed requirements>
```

Implementation and acceptance:

```text
$delivery-loop
The technical plan is confirmed. Proceed with TDD: add tests first, then change code, and output an acceptance evidence checklist when done.
<paste the plan or reference local file paths>
```

Final knowledge capture:

```text
$delivery-loop
The requirement has completed release observation. Retrospect this delivery and separate stable business knowledge, process improvements, and one-off archived material.
<paste acceptance and release observation records>
```

Execution evaluation:

```text
$delivery-loop
Run a 6-dimension quantitative evaluation on the artifact files, test results, and process completeness of this delivery cycle. Output a score report with the grade.
```

## Installation

Install to the current project's general agent skills directory:

```bash
npx delivery-loop
```

Default target:

```text
.agents/skills/delivery-loop
```

Install to a specific agent's global directory:

```bash
npx delivery-loop --global --agent codex
npx delivery-loop --global --agent claude-code
npx delivery-loop --global --agent cursor
npx delivery-loop --global --agent openclaw
npx delivery-loop --global --agent opencode
npx delivery-loop --global --agent hermes
```

Install to a specific agent's project directory:

```bash
npx delivery-loop --project --agent codex
npx delivery-loop --project --agent claude-code
npx delivery-loop --project --agent openclaw
npx delivery-loop --project --agent opencode
```

Common target paths:

| agent | Project Directory | Global Directory |
| --- | --- | --- |
| universal | `.agents/skills/delivery-loop` | `~/.config/agents/skills/delivery-loop` |
| codex | `.agents/skills/delivery-loop` | `~/.codex/skills/delivery-loop` |
| claude-code | `.claude/skills/delivery-loop` | `~/.claude/skills/delivery-loop` |
| cursor | `.agents/skills/delivery-loop` | `~/.cursor/skills/delivery-loop` |
| openclaw | `skills/delivery-loop` | `~/.openclaw/skills/delivery-loop` |
| opencode | `.opencode/skills/delivery-loop` | `~/.config/opencode/skills/delivery-loop` |
| hermes | Configure an external Hermes directory or specify `--target` | `~/.hermes/skills/delivery-loop` |

List supported agent paths:

```bash
npx delivery-loop --list-agents
```

If your agent uses another directory, specify the final skill directory directly:

```bash
npx delivery-loop --target ./vendor/skills/delivery-loop
```

Use npm's git spec directly from GitHub:

```bash
npx github:WekiLee/delivery-loop
```

You can also install from GitHub with the open agent skills CLI:

```bash
npx skills add WekiLee/delivery-loop -a codex -g
npx skills add WekiLee/delivery-loop -a claude-code -g
npx skills add WekiLee/delivery-loop -a openclaw -g
npx skills add WekiLee/delivery-loop -a opencode -g
```

Project URL: https://github.com/WekiLee/delivery-loop

## Local Development and Validation

```bash
npm run check
npm run validate
npm run pack:dry-run
```

Command meanings:

- `npm run check`: check syntax for the installer and skill validator scripts.
- `npm run validate`: validate the `SKILL.md` frontmatter, name, description, and body.
- `npm run pack:dry-run`: confirm the npm package contains the expected files.

## Project Structure

```text
.
├── SKILL.md
├── agents/
│   └── openai.yaml
├── bin/
│   ├── install.mjs
│   └── validate-skill.mjs
├── references/
│   └── eval-template.md
├── package.json
├── README.md
├── README.en.md
└── LICENSE
```

## License

This project uses the MIT License. See [LICENSE](./LICENSE).
