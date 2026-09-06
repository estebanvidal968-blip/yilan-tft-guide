# 弈览 · 部署铁律

> 唯一可编辑源 = `lol-tft-guide`（git 仓库）。其它任何目录只是构建产物 / 快照，不可人手改。

## 为什么有这个规则

2026-09-06 我们踩过一次坑：git 仓库与 tar 副本两份 `content/guides.js` 出现"git 提交 9 篇、磁盘 9 篇但线上 24 篇"的认知偏差，根因是 gen15.py 生成的 15 篇用 `"slug": "..."`（带引号键），与基础 9 篇的 `slug:` 混排，靠单一正则 `slug:` 计数会漏报。一份副本 vs 真源，永远有漂移风险。

部署脚本统一从 **git HEAD** 直接打包发布，副本（`lol-tft-guide-new` 等）一律视为产物，不再可编辑。

## 可编辑 vs 不可编辑

| 路径 | 性质 | 说明 |
|---|---|---|
| `E:\AI_workbuddy\projects\lol-tft-guide\` | **唯一可编辑源（git）** | 改攻略 / 写脚本 / 调样式都在这里 |
| `E:\AI_workbuddy\projects\lol-tft-guide-new\` | **产物快照（已锁）** | 2026-09-06 起改名为 `.workbuddy-snapshot` 并写死 README，禁止人手编辑 |
| 服务器 `/opt/yilan/app/` | 部署产物 | 由 deploy.sh 覆盖，不可人手改 |
| 服务器 `/opt/yilan/app.bak.<ts>` | 回滚备份 | deploy 时自动生成 |

## 发布流程（双目标）

```bash
# 单目标
bash scripts/deploy.sh selfhosted
bash scripts/deploy.sh workbuddy   # preflight + 提示 agent 调工具

# 双目标
bash scripts/deploy.sh all
```

每个 target 统一 5 步：
1. **预检**（`scripts/preflight.sh`）：攻略 = 24 / 关键文件齐 / 无版本页残留 / .gitignore 覆盖。
2. **打包**：`git archive` 排除 .git（tracked-only，.next/node_modules 因 gitignored 自动排除）。
3. **分发**：
   - `selfhosted`：scp 到 `ubuntu@124.223.170.208:/tmp/` + 服务器侧 `deploy-selfhosted-server.sh`（nohup 脱离 + 轮询日志）。
   - `workbuddy`：由 agent 调 `workbuddy_sites_deploy`，`directory=$ROOT`，`startCmd="env -u NODE_OPTIONS rm -rf .next && npm run build && npm start"`。
4. **外部验证**：curl 目标 `/guides` 攻略链接去重 = 24。
5. **回滚**：失败时回 `app.bak.<最新时间戳>` 一键重启：
   ```bash
   sudo docker stop yilan && sudo docker rm yilan
   sudo cp -a /opt/yilan/app.bak.<最新> /opt/yilan/app
   sudo docker run -d --name yilan --restart unless-stopped -p 80:3000 \
     -v /opt/yilan/data/social:/app/data/social yilan:latest
   ```

## 已踩坑（防回归）

- `startCmd` 必须 `env -u NODE_OPTIONS rm -rf .next && npm run build && npm start`，否则 safe-delete 拦 .next 清理 → 复用陈旧产物。
- 服务器侧构建/部署用 `nohup ... &` + 轮询日志（沙箱 SSH 后台被拦，坑 #6）。
- docker 命令需 `sudo -n`（ubuntu 在 sudo 组免密，但不在 docker 组）。
- 攻略计数用兼容正则 `["\']?slug["\']?\s*:\s*["\']([A-Za-z0-9-]+)["\']` 处理引号键混排。
- 域名上线前 ICP 备案必须通过；未通过时仅 IP 直访，Caddy 留 stage-1。

## 变更提案流程

1. 改 `lol-tft-guide` 内文件 → `git commit`。
2. 跑 `bash scripts/deploy.sh selfhosted`（或 `all`）做 dry-run。
3. 验证攻略 = 24 + 关键标记（信息差 / 国服口径 / 无版本页）→ 正式生效。
4. 不允许：复制副本改、scp 手工改服务器、改 `lol-tft-guide-new`。