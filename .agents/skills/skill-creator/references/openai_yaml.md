# `openai.yaml` 字段说明（完整示例 + 描述）

`agents/openai.yaml` 是一份扩展的、面向产品/harness 的配置文件，主要供机器读取，而不是给 agent 当正文说明用。其他产品侧专用配置也可以放在 `agents/` 目录下。

## 完整示例

```yaml
interface:
  display_name: "Optional user-facing name"
  short_description: "Optional user-facing description"
  icon_small: "./assets/small-400px.png"
  icon_large: "./assets/large-logo.svg"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt to use the skill with"

dependencies:
  tools:
    - type: "mcp"
      value: "github"
      description: "GitHub MCP server"
      transport: "streamable_http"
      url: "https://api.githubcopilot.com/mcp/"
```

## 字段说明与约束

顶层约束：

- 所有字符串值都要加引号。
- key 保持不加引号。
- 对于 `interface.default_prompt`：应基于 skill 生成一条有帮助、简短（通常 1 句话）的默认提示词，并且必须显式包含 `$skill-name`，例如：`"Use $skill-name-here to draft a concise weekly status update."`

- `interface.display_name`：展示在 UI skill 列表和 chip 中的人类可读标题。
- `interface.short_description`：给人快速扫描的短说明，建议 25–64 个字符。
- `interface.icon_small`：小图标资源路径（相对 skill 目录）。默认放在 `./assets/`，图标文件也建议存放在 skill 的 `assets/` 目录下。
- `interface.icon_large`：大 logo 资源路径（相对 skill 目录）。默认放在 `./assets/`，图标文件也建议存放在 skill 的 `assets/` 目录下。
- `interface.brand_color`：用于 UI 点缀（如 badge）的十六进制颜色值。
- `interface.default_prompt`：调用该 skill 时插入的默认提示片段。
- `dependencies.tools[].type`：依赖类型。目前只支持 `mcp`。
- `dependencies.tools[].value`：工具或依赖的标识符。
- `dependencies.tools[].description`：对该依赖的人类可读说明。
- `dependencies.tools[].transport`：当 `type` 是 `mcp` 时的连接类型。
- `dependencies.tools[].url`：当 `type` 是 `mcp` 时的 MCP server URL。
