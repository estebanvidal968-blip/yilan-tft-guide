# 弈览 · 部署手册（腾讯云轻量 · Ubuntu 22.04）

> 资产与到期时间见 `E:\AI_workbuddy\知识库\05-Archive\弈览-资产台账.md`

## 架构

```
用户 → Caddy(80/443, 自动HTTPS) → Docker 容器 yilan(Next.js, 3000)
                                      └─ 卷挂载 /opt/yilan/data/social (点赞/评论 JSON)
```

## 阶段一：备案前（IP 直接访问验证）

1. 登录服务器（腾讯云控制台「OrcaTerm 网页终端」或本机 SSH）
2. 执行初始化脚本（把 `setup-server.sh` 内容粘贴执行）：
   ```bash
   bash setup-server.sh
   ```
   脚本做的事：系统更新 → 装 Docker → `git clone` 本仓库 → `docker build` → 启动容器（80 端口，数据卷持久化）→ ufw 防火墙放行 22/80/443
3. 浏览器访问 `http://<公网IP>` 验证站点可用
4. 更新部署：
   ```bash
   cd /opt/yilan/app && git pull && docker build -t yilan:latest . && docker rm -f yilan && \
   docker run -d --name yilan --restart unless-stopped -p 80:3000 \
     -v /opt/yilan/data/social:/app/data/social yilan:latest
   ```
   （或重复执行 `setup-server.sh`，脚本可重复运行）

## 阶段二：备案通过后（域名 + HTTPS）

1. 腾讯云 DNS 解析添加（免费 DNSPod）：
   | 主机记录 | 记录类型 | 记录值 |
   |---|---|---|
   | `@` | A | `<服务器公网IP>` |
   | `www` | A | `<服务器公网IP>` |
2. 编辑 `deploy/Caddyfile`：删除 `:80` 段，启用域名段
3. 执行 `bash deploy/install-caddy.sh` → Caddy 自动签发 Let's Encrypt 证书并永久自动续期
4. 验证：`curl -I https://yilangames.com` 返回 200

## 未来加新游戏子站（例 lol.yilangames.com）

1. DNS 加一条 A 记录：`lol` → `<服务器公网IP>`
2. 新项目部署到服务器其他端口（如 3001）
3. Caddyfile 加一段反代 → `systemctl reload caddy`
4. 无需额外备案（同一备案号覆盖全部子域名）

## 运维速查

```bash
docker ps                       # 看容器状态
docker logs -f yilan            # 看应用日志
systemctl status caddy          # 看反代状态
docker restart yilan            # 重启应用
```

## 注意事项

- **不要**在这台机器上绑未备案域名对外提供其他服务（如 OpenClaw）——备案内容必须与实际一致
- 点赞/评论数据在 `/opt/yilan/data/social/`，重装系统前务必备份
- 3M 带宽 + 全静态 SSG，起步并发足够；流量包 300GB/月，超了按量计费（约 0.8 元/GB），日常攻略站用不完
