---
name: skill-creator
description: 指导创建高质量 skill。适用于用户希望新建 skill，或更新现有 skill 以扩展 Codex 在某个领域的专业知识、工作流或工具集成时。
---

# Skill 创建器

此 skill 用于指导如何创建有效、可维护、可复用的 skill。

## 关于 Skill

Skill 是模块化、可自包含的目录，通过提供专业知识、工作流和工具来扩展 Codex 的能力。可以把它理解为特定领域或任务的“上岗指南”。

它会把 Codex 从通用型 agent，转变为拥有特定流程知识和上下文资产的专业 agent。这些知识往往不适合完全依赖模型预训练记忆。

### Skill 能提供什么

1. 专项工作流：面向特定领域的多步骤流程
2. 工具集成：处理特定文件格式或 API 的说明
3. 领域知识：公司内部知识、schema、业务规则
4. 配套资源：为复杂或重复任务准备的脚本、参考资料和资产

## 核心原则

### 简洁优先

上下文窗口是公共资源。Skill 要和 system prompt、对话历史、其他 skill 的 metadata，以及当前用户请求共享同一份上下文预算。

**默认假设：Codex 已经足够聪明。** 只补充它原本没有、但执行任务确实需要的信息。对每一段说明都要追问：

- “Codex 真的需要这段解释吗？”
- “这段内容配得上它消耗的 token 吗？”

优先使用简短示例，而不是冗长解释。

### 选择合适的自由度

具体程度要和任务的脆弱性、变体空间相匹配：

**高自由度（文本说明）**：适用于可行方案很多、需要结合上下文判断、或只能给出启发式原则的场景。

**中自由度（伪代码或带参数脚本）**：适用于已有推荐模式、允许少量变化、或行为受配置影响的场景。

**低自由度（固定脚本、少量参数）**：适用于操作脆弱、容易出错、强依赖一致性，或必须按固定顺序执行的场景。

可以把 Codex 想成在“选路”：

- 两边是悬崖的独木桥，需要明确护栏，应该用低自由度。
- 开阔平原有很多可行路径，就可以给更高自由度。

### Skill 的组成结构

每个 skill 至少包含一个必需的 `SKILL.md`，并可按需附带资源：

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
├── agents/ (recommended)
│   └── openai.yaml - UI metadata for skill lists and chips
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```

#### `SKILL.md`（必需）

每个 `SKILL.md` 都应包含：

- **Frontmatter**（YAML）：包含 `name` 和 `description`。Codex 仅依赖这两个字段判断何时触发 skill，因此必须把“它做什么”和“什么情况下应使用它”写清楚。
- **Body**（Markdown）：说明如何使用该 skill 及其资源。只有在 skill 被触发后才会加载。

#### `agents` 元数据（推荐）

- 面向 UI 的 skill 列表与 chip 元数据
- 生成前先阅读 `references/openai_yaml.md`，遵守其中的字段说明与约束
- 通过阅读 skill 本身来生成人类可读的 `display_name`、`short_description` 和 `default_prompt`
- 将这些值通过 `--interface key=value` 传给 `scripts/generate_openai_yaml.py` 或 `scripts/init_skill.py`，以确定性方式生成
- 更新 skill 后，要校验 `agents/openai.yaml` 是否仍与 `SKILL.md` 一致；如果 stale，就重新生成
- 其他可选 UI 字段（图标、品牌色等）只有在用户明确提供时才添加
- 字段定义与示例见 `references/openai_yaml.md`

#### 配套资源（可选）

##### 脚本（`scripts/`）

用于需要确定性可靠性、或会被反复重写的任务的可执行代码（Python/Bash 等）。

- **何时引入**：当同一段代码会被反复重写，或任务需要确定性可靠性时
- **示例**：用于旋转 PDF 的 `scripts/rotate_pdf.py`
- **优势**：省 token、结果确定、很多时候可直接执行而无需先把内容加载进上下文
- **注意**：如果需要 patch 或适配环境，Codex 仍可能要先读脚本内容

##### 参考资料（`references/`）

面向“按需加载”的文档和参考材料，用来辅助 Codex 的思考和执行。

- **何时引入**：当 Codex 在执行时需要引用某份文档
- **示例**：财务 schema 的 `references/finance.md`、NDA 模板的 `references/mnda.md`、公司政策的 `references/policies.md`、API 规范的 `references/api_docs.md`
- **常见用途**：数据库 schema、API 文档、领域知识、公司政策、详细工作流
- **优势**：让 `SKILL.md` 保持精简，只在需要时才加载
- **最佳实践**：如果文件很大（>10k words），在 `SKILL.md` 中给出 grep 搜索提示
- **避免重复**：信息应放在 `SKILL.md` 或 `references/*` 的其中一处，而不是两边都写。详细资料优先下沉到 `references/`，只把必要的流程和判断准则留在 `SKILL.md`

##### 资产（`assets/`）

这类文件通常不需要被加载进上下文，而是作为 Codex 产出的输入素材或模板。

- **何时引入**：当 skill 需要一些文件直接参与最终输出
- **示例**：品牌 logo 的 `assets/logo.png`、PPT 模板 `assets/slides.pptx`、HTML/React 脚手架 `assets/frontend-template/`、字体文件 `assets/font.ttf`
- **常见用途**：模板、图片、图标、样板代码、字体、可复制修改的示例文档
- **优势**：把输出资源和说明文档分离，Codex 可以直接使用这些文件，而不必先把它们读进上下文

#### Skill 里不要放什么

Skill 应只保留直接支撑其功能的必要文件。不要额外创建多余文档或辅助文件，例如：

- README.md
- INSTALLATION_GUIDE.md
- QUICK_REFERENCE.md
- CHANGELOG.md
- etc.

Skill 只应包含 AI agent 完成当前任务所需的信息，不应额外塞入创建过程说明、搭建与测试步骤、面向人的用户文档等无关材料。过多的附属文档只会制造噪音和歧义。

### 渐进式披露设计原则

Skill 通过三层加载机制控制上下文成本：

1. **Metadata（name + description）**：始终在上下文中（约 100 词）
2. **`SKILL.md` 正文**：skill 触发后再加载（<5k words）
3. **配套资源**：按需加载（理论上无限，因为脚本可直接执行，不必全文读入上下文）

#### 常见渐进式披露模式

将 `SKILL.md` 保持在“只写必要内容”的范围内，最好不要超过 500 行，避免上下文膨胀。接近这个规模时，应把内容拆到独立文件，并在 `SKILL.md` 中明确写出：

- 这些文件存在
- 什么时候该读
- 为什么要读

**关键原则：** 当一个 skill 支持多个变体、框架或选项时，`SKILL.md` 只保留核心流程和选择逻辑；具体模式、示例、配置等细节应拆到独立的参考文件中。

**模式 1：高层指南 + 外部参考**

```markdown
# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
```

Codex 只会在需要时再去加载 `FORMS.md`、`REFERENCE.md` 或 `EXAMPLES.md`。

**模式 2：按领域拆分**

对于覆盖多个领域的 skill，应按领域组织内容，避免把无关上下文也一起加载：

```
bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
```

当用户问销售指标时，Codex 只需要读 `sales.md`。

同理，支持多个框架或变体的 skill 也应按变体拆分：

```
cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
```

当用户选择 AWS 时，Codex 只需要读取 `aws.md`。

**模式 3：按需展开细节**

正文只放基础内容，把高级内容改成引用：

```markdown
# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
```

只有当用户需要这些能力时，Codex 才去加载 `REDLINING.md` 或 `OOXML.md`。

**重要建议：**

- **避免过深的引用层级**：参考文件最好只比 `SKILL.md` 深一层，且都要能从 `SKILL.md` 直接找到。
- **大文件要有目录**：超过 100 行的参考文件，建议在开头加目录，方便 Codex 预览时快速看到整体结构。

## Skill 创建流程

创建 skill 通常按以下步骤推进：

1. 用具体例子理解 skill 的使用场景
2. 规划可复用内容（scripts、references、assets）
3. 初始化 skill（运行 `init_skill.py`）
4. 编辑 skill（补资源、写 `SKILL.md`）
5. 校验 skill（运行 `quick_validate.py`）
6. 依据真实使用持续迭代

通常应按顺序执行，只有在明确不适用时才跳步。

### Skill 命名

- 仅使用小写字母、数字和连字符；把用户给出的标题规范化为 hyphen-case，例如 `"Plan Mode"` -> `plan-mode`
- 名称长度控制在 64 个字符以内（仅计字母、数字、连字符）
- 优先使用简短、以动作开头的短语
- 当按工具做命名空间有助于触发或辨识时再这样做，例如 `gh-address-comments`、`linear-address-issue`
- skill 目录名必须和 skill 名完全一致

### Step 1：用具体例子理解 Skill

只有在 skill 的使用模式已经非常明确时，才可以跳过这一步。即便是修改现有 skill，这一步通常也依然有价值。

要创建有效的 skill，先要明确它会如何被实际使用。这些例子可以来自用户直接提供的场景，也可以来自你先假设、再通过用户反馈确认的示例。

例如，设计一个 `image-editor` skill 时，可以先问：

- "What functionality should the image-editor skill support? Editing, rotating, anything else?"
- "Can you give some examples of how this skill would be used?"
- "I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
- "What would a user say that should trigger this skill?"

不要一次抛给用户太多问题，避免造成负担。先问最关键的，再按需要追问。

当你已经能清楚描述 skill 应支持哪些能力时，这一步就可以结束。

### Step 2：规划可复用的 Skill 内容

要把具体例子沉淀成一个真正有用的 skill，需要对每个例子做拆解：

1. 如果从零做这件事，自己会怎么执行
2. 哪些 `scripts`、`references`、`assets` 能让这类任务反复执行时更省力、更稳定

示例：如果要做一个 `pdf-editor` skill 来处理 “Help me rotate this PDF” 这类请求，分析结果可能是：

1. 旋转 PDF 需要每次重复写相似代码
2. 把 `scripts/rotate_pdf.py` 固化进 skill 会更合适

示例：如果设计一个 `frontend-webapp-builder` skill 来处理 “Build me a todo app” 或 “Build me a dashboard to track my steps” 这类请求，分析结果可能是：

1. 前端 WebApp 经常重复生成一套样板 HTML/React 结构
2. 把 `assets/hello-world/` 这类模板目录放进 skill 会更高效

示例：如果做一个 `big-query` skill 来处理 “How many users have logged in today?” 这类请求，分析结果可能是：

1. 每次查 BigQuery 都要重新摸清表结构和关系
2. 应在 skill 中保留一份记录 schema 的 `references/schema.md`

最终目标是把这些具体例子转成一份“应包含哪些可复用资源”的清单：脚本、参考资料、资产分别需要哪些。

### Step 3：初始化 Skill

到这一步就该真正创建 skill 了。

只有当目标 skill 已经存在时，才可以跳过这一步，直接进入下一步。

如果是从零新建 skill，始终先运行 `init_skill.py`。这个脚本会生成包含必需结构的新模板目录，能显著提升创建效率并减少遗漏。

用法：

```bash
scripts/init_skill.py <skill-name> --path <output-directory> [--resources scripts,references,assets] [--examples]
```

示例：

```bash
scripts/init_skill.py my-skill --path skills/public
scripts/init_skill.py my-skill --path skills/public --resources scripts,references
scripts/init_skill.py my-skill --path skills/public --resources scripts --examples
```

该脚本会：

- 在指定路径下创建 skill 目录
- 生成带有正确 frontmatter 和 TODO 占位的 `SKILL.md` 模板
- 根据通过 `--interface key=value` 传入的 `display_name`、`short_description`、`default_prompt` 生成 `agents/openai.yaml`
- 按 `--resources` 选项创建资源目录
- 如果传了 `--examples`，补充示例文件

初始化完成后，再继续定制 `SKILL.md` 并按需添加资源。如果使用了 `--examples`，记得把占位示例替换掉或删除。

`display_name`、`short_description` 和 `default_prompt` 应先通过阅读 skill 内容来确定，再以 `--interface key=value` 传给 `init_skill.py`；如需重建，可运行：

```bash
scripts/generate_openai_yaml.py <path/to/skill-folder> --interface key=value
```

其他可选 interface 字段只有在用户明确提供时才添加。字段完整说明与示例见 `references/openai_yaml.md`。

### Step 4：编辑 Skill

无论是新生成的 skill 还是现有 skill，在编辑时都要记住：这个 skill 是写给“另一个 Codex 实例”使用的。应优先补充那些对 Codex 有帮助、但又不显而易见的信息，例如流程性知识、领域细节和可复用资产。

#### 先落可复用内容

开始实现时，优先补齐前面识别出的可复用资源：`scripts/`、`references/`、`assets/`。这一步可能需要用户输入，例如制作 `brand-guidelines` skill 时，用户可能要提供品牌素材、模板或参考文档。

新增脚本必须实际运行测试，确认没有 bug，且输出符合预期。如果脚本很多且形态相近，可以抽样验证代表性样本，但要保证足够建立信心。

如果使用了 `--examples`，把不需要的占位文件删掉。只创建真正需要的资源目录。

#### 更新 `SKILL.md`

**写作准则：** 始终使用祈使式或不定式风格。

##### Frontmatter

YAML frontmatter 只写 `name` 和 `description`：

- `name`：skill 名称
- `description`：这是 skill 的主要触发机制，帮助 Codex 理解什么时候该用它。
  - 同时说明“这个 skill 做什么”和“什么触发场景下该用它”
  - 所有“when to use”信息都写在这里，不要放到正文里。正文只有在 skill 已经触发后才会加载，所以正文里的 “When to Use This Skill” 对触发没有帮助
  - `docx` skill 的 description 示例：`"Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. Use when Codex needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"`

YAML frontmatter 不要放其他字段。

##### 正文

正文负责说明如何使用这个 skill 以及它的配套资源。

### Step 5：校验 Skill

完成开发后，先运行校验脚本，尽早发现基础问题：

```bash
scripts/quick_validate.py <path/to/skill-folder>
```

校验脚本会检查 YAML frontmatter 格式、必填字段和命名规则。如果失败，就按报错修复后再执行一次。

### Step 6：迭代优化

skill 经过真实使用后，用户很可能会提出改进意见。很多时候，这种反馈会在刚用完之后立即出现，因为问题和痛点还很新鲜。

**迭代流程：**

1. 用 skill 处理真实任务
2. 观察它的卡点、低效点或误触发点
3. 判断 `SKILL.md` 或配套资源该如何调整
4. 改完后重新测试
