# Agent 研发闭环 · 执行评测模板

> 用法：跑完一轮 delivery-loop 后（或 Step 5 质量门通过后），用此模板对本次执行做量化评分。
> 所有检查项必须是**确定性**的（检查文件存在/内容模式/测试结果/编译状态），零 LLM 评委调用。
> 3 次跑同一批 case 应产生 hash 一致的结果。

## 评分总览

| 维度 | 权重 | 得分 | 满分 | 说明 |
|------|------|------|------|------|
| 流程完整性 | 25% | / | 100 | 该走的阶段是否都走了 |
| 产物质量 | 25% | / | 100 | 文档/方案的实质性 content |
| 实现正确性 | 25% | / | 100 | 代码能跑、测试能过 |
| 安全合规 | 10% | / | 100 | 是否违反自身规则 |
| 效率 | 10% | / | 100 | 耗时与成本 |
| 迭代能力 | 5% | / | 100 | 失败后能否自愈 |
| **综合** | **100%** | **/100** | **100** | |

---

## 维度 1：流程完整性（权重 25%）

**检查什么**：该走的阶段节点是否都走了，产物文件是否都存在。

**评分规则**：按需求意图动态调整必需节点集。

### 必需节点（按需求类型裁剪）

| 节点 | BUG_FIX/LOW | FEATURE/MEDIUM | FEATURE/HIGH | 检查方式 |
|------|-------------|----------------|--------------|----------|
| 需求进入上下文整理 | ✅ | ✅ | ✅ | 文件 `context.md` 存在 |
| 需求澄清（requirements） | ❌ | ✅ | ✅ | 文件 `requirements.md` 存在 |
| 技术方案（plan） | ❌ | ✅ | ✅ | 文件 `plan.md` 存在 |
| TDD 实现 | ❌ | ✅ | ✅ | 测试文件先于实现文件（git log 验证） |
| 内部质量门 | ✅ | ✅ | ✅ | `quality-gate/` 下有证据文件 |
| 验收 | ❌ | ✅ | ✅ | 验收文档或证据存在 |
| 发布观察 | ❌ | ❌ | ✅ | 发布记录或监控确认存在 |
| 结项沉淀 | ❌ | ❌ | ✅ | `memory` 或 `skill` 更新记录存在 |

**裁剪规则**：
- 纯查询/问答：0 分不适用 → 不跑评测
- BUG_FIX/LOW：必走 3 个节点 → (已走数 / 3) × 100
- FEATURE/MEDIUM：必走 6 个节点 → (已走数 / 6) × 100
- FEATURE/HIGH：必走 8 个节点 → (已走数 / 8) × 100

### 评分检查（Python 确定性）

```python
# 伪代码 — 实际执行时用 find + jq 或 Python
import os, re

def check_process_completeness(work_dir: str, intent: str = "FEATURE") -> float:
    nodes = {
        "context": "context.md",
        "req": "requirements.md",
        "plan": "plan.md",
        "tdd": "test_files_before_code",  # 特殊检查
        "quality": "quality-gate/",
        "accept": "acceptance.md",
        "observe": "observation.md",
        "review": "review.md",
    }

    required = {
        "BUG_FIX":  ["quality"],
        "FEATURE/MEDIUM": ["context", "req", "plan", "tdd", "quality", "accept"],
        "FEATURE/HIGH": ["context", "req", "plan", "tdd", "quality", "accept", "observe", "review"],
    }

    # TDD 特殊检查：git log 中测试文件提交早于实现文件
    def check_tdd():
        log = subprocess.run(["git", "log", "--oneline", "--diff-filter=A", "*.test.*"],
                            capture_output=True, text=True, cwd=work_dir)
        return len(log.stdout.strip().split("\n")) > 0

    results = {}
    for node in required.get(intent, []):
        if node == "tdd":
            results[node] = check_tdd()
        else:
            path = os.path.join(work_dir, nodes[node])
            results[node] = os.path.exists(path)

    total = sum(1 for v in results.values() if v)
    max_n = len(required.get(intent, []))
    return (total / max_n) * 100.0
```

**设计原则**：
- 不靠"模型说做了"，靠"产物文件在不在"——文件系统不会说谎
- 按 intent 动态裁剪：QUERY 不要求任何产物（满分），BUG_FIX 只查 3 个，FEATURE/HIGH 查 8 个

---

## 维度 2：产物质量（权重 25%）

**检查什么**：文档是否写了实质性内容，而非模板套话/注水。

### 2a. Requirements 质量（50% 权重）

```python
def score_req_quality(req_path: str) -> float:
    with open(req_path) as f:
        text = f.read()

    checks = [
        ("有验收标准", len(re.findall(r"验收|acceptance|criteria|标准", text, re.I)) >= 2),
        ("有风险", len(re.findall(r"风险|risk|不确定|uncertain", text, re.I)) >= 1),
        ("有非目标边界", len(re.findall(r"不做了?|非目标|边界|out.?of.?scope|exclude", text, re.I)) >= 1),
        ("非模板套话", len(text.strip()) > 500),  # 反注水
    ]
    passed = sum(1 for _, ok in checks if ok)
    return (passed / len(checks)) * 100.0
```

### 2b. Plan 质量（50% 权重）

```python
def score_plan_quality(plan_path: str) -> float:
    with open(plan_path) as f:
        text = f.read()

    checks = [
        ("有影响范围", len(re.findall(r"影响|范围|涉及|impact|scope|module", text, re.I)) >= 2),
        ("有回滚策略", len(re.findall(r"回滚|rollback|回退|恢复", text, re.I)) >= 1),
        ("有验收方式", len(re.findall(r"验收|验证|verify|validate|测试", text, re.I)) >= 2),
        ("有配置依赖", len(re.findall(r"配置|config|schema|开关|feature.?flag", text, re.I)) >= 1),
        ("非模板套话", len(text.strip()) > 800),
    ]
    passed = sum(1 for _, ok in checks if ok)
    return (passed / len(checks)) * 100.0
```

---

## 维度 3：实现正确性（权重 25%）

**检查什么**：代码能不能编译？测试能不能过？

### 评分规则

```python
def score_correctness(work_dir: str) -> float:
    # 真跑编译 + 真跑测试
    # 注意：这里必须实际执行，不信 AI 自报

    scores = []

    # 3a. 编译通过（40%）
    result = subprocess.run(COMPILE_CMD, shell=True, capture_output=True, cwd=work_dir)
    compile_ok = result.returncode == 0
    scores.append(("compile", 40 if compile_ok else 0))

    # 3b. 测试通过（40%）
    result = subprocess.run(TEST_CMD, shell=True, capture_output=True, cwd=work_dir)
    test_ok = result.returncode == 0
    scores.append(("test", 40 if test_ok else 0))

    # 3c. 诚实度差距（20%） — AI 自报 vs 实际结果
    # 如果 evidence.json 声称 G3 通过但编译挂了，扣分
    evidence_path = os.path.join(work_dir, "evidence.json")
    if os.path.exists(evidence_path):
        with open(evidence_path) as f:
            evidence = json.load(f)
        claimed = evidence.get("gates_passed", [])
        if "G3" in claimed and not compile_ok:
            scores.append(("honesty", 0))  # 虚报 — 扣到 0
        elif "G3" not in claimed and compile_ok:
            scores.append(("honesty", 20))  # 谦虚 — 不扣
        elif "G3" in claimed and compile_ok:
            scores.append(("honesty", 20))  # 诚实
        else:
            scores.append(("honesty", 10))  # 没报也没过 — 中性
    else:
        scores.append(("honesty", 10))  # 无 evidence.json

    return sum(s for _, s in scores)
```

**关键设计**：
- 真跑编译 + 真跑测试，不信 AI 自报
- honest gap 检测——AI 说了 G3 通过但实际没过的，诚实度扣分
- 权重最大的是"结果"不是"过程"：测试过 > 文档写得好

---

## 维度 4：安全合规（权重 10%）

**检查什么**：有没有违反 delivery-loop 自身规则。

```python
def score_compliance(work_dir: str) -> float:
    issues = []

    # 4a. 是否跳过质量门？（大忌）
    missing_files = []
    for gate in ["requirements.md", "plan.md"]:
        if not os.path.exists(os.path.join(work_dir, gate)):
            missing_files.append(gate)

    # 4b. 配置是否在方案阶段处理？（不是在验收时才发现）
    # 如果验收文档提到"配置问题"但 plan.md 没有 "配置" 字段，扣分
    plan_path = os.path.join(work_dir, "plan.md")
    accept_path = os.path.join(work_dir, "acceptance.md")
    if os.path.exists(plan_path) and os.path.exists(accept_path):
        with open(plan_path) as f: plan_text = f.read()
        with open(accept_path) as f: accept_text = f.read()
        if "配置" in accept_text and "配置" not in plan_text:
            issues.append("配置问题在验收阶段才暴露")

    # 4c. CR 评论是否落在平台评论体系，没留在对话里（纯提示）
    # 4d. TDD 是否真 TDD（测试先于代码）？
    # 已经有流程完整性维度检查，这里不重复

    # 评分
    deductions = len(issues) * 25  # 每个问题扣 25 分
    return max(0, 100 - deductions)
```

---

## 维度 5：效率（权重 10%）

**检查什么**：花了多少时间、多少 token/工具调用。

```python
def score_efficiency(start_time: datetime, end_time: datetime,
                     tool_calls_count: int, file_changes: int) -> float:
    duration = (end_time - start_time).total_seconds()

    # 基准：FEATURE/MEDIUM 预期 30 分钟，FEATURE/HIGH 预期 60 分钟
    # 超时 2 倍 = 50 分，超时 3 倍 = 0 分
    time_budget = 30 * 60  # 30 分钟（可配置）
    time_score = 100 * (1 - max(0, (duration - time_budget) / (time_budget * 2)))
    time_score = max(0, min(100, time_score))

    # 工具调用效率：超过 100 次工具调用开始扣分
    call_budget = 100
    call_score = 100 * (1 - max(0, (tool_calls_count - call_budget) / call_budget))
    call_score = max(0, min(100, call_score))

    return (time_score * 0.6 + call_score * 0.4)
```

---

## 维度 6：迭代能力（权重 5%）

**检查什么**：如果编译/测试失败了，Agent 能不能自己修好？

```python
def score_iteration(work_dir: str) -> float:
    # 检测 transcript 中的 BUILD FAILURE → BUILD SUCCESS 恢复链条
    # 需要 Hermes 轨迹文件支持

    log_path = os.path.join(work_dir, "trajectory.log")
    if not os.path.exists(log_path):
        return 50  # 中性分 — 无轨迹数据

    with open(log_path) as f:
        log = f.read()

    failures = re.findall(r"BUILD FAILURE|FAIL|ERROR|编译失败", log)
    successes_after_fail = re.findall(
        r"BUILD FAILURE.*?BUILD SUCCESS|FAIL.*?SUCCESS",
        log, re.DOTALL
    )

    if len(failures) == 0:
        return 100  # 没有失败 = 满分
    else:
        recovery_rate = len(successes_after_fail) / len(failures)
        return min(100, recovery_rate * 100)
```

---

## 综合评分

```python
def compute_total(dimensions: dict) -> dict:
    weights = {
        "流程完整性": 0.25,
        "产物质量": 0.25,
        "实现正确性": 0.25,
        "安全合规": 0.10,
        "效率": 0.10,
        "迭代能力": 0.05,
    }

    total = 0.0
    for dim, score in dimensions.items():
        total += score * weights.get(dim, 0)

    return {
        "dimensions": dimensions,
        "total": round(total, 1),
        "grade": grade_from_score(total),
    }

def grade_from_score(score: float) -> str:
    if score >= 90: return "S"
    elif score >= 80: return "A"
    elif score >= 70: return "B"
    elif score >= 60: return "C"
    else: return "D"
```

---

## 对抗偏差设计

1. **确定性优先**：不用 LLM 评委。分数必须是可复现的——3 次跑同一 case 结果 hash 一致
2. **失败响亮**：不兜底。跑一个不存在的 case → 返回 0 分，不被默默兜底成 70 分
3. **双评分器**（未来）：
   ```
   评分器 1（Python 确定性）：当前方案
   评分器 2（LLM 评委投票）：用于产物质量维度（选配），3 次投票取中位数对冲方差
   ```
