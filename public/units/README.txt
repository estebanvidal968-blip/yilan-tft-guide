弈览 · 金铲铲 S18「自然之力」棋子立绘拖入式目录
================================================

这里放“当前赛季（金铲铲 S18）”的棋子立绘 PNG，即可替换默认的标准英雄头像。
找不到可热链的金铲铲立绘 CDN 时，这是拿到真·赛季立绘的唯一可靠路径。

命名规则：用英雄的英文 key 作文件名，例如：
  Cassiopeia.png   阿狸→Ahri.png   塔里克→Taric.png
  （与 Riot Data Dragon 的英雄 key 一致；带形态后缀也行，如 Gnar.png）

金铲铲 S18 独占的「峡谷野怪」单位（石甲虫 / 魔沼蛙 / 远古巨龙等），
它们的英文 key 来自 OP.GG 原始数据，可用对应名放置以启用立绘：
  Sentry.png   Murkwolf.png   Krug.png   Brambleback.png   Sentinel.png   ElderDragon.png
  （不放置则自动回退为文字 token，不影响使用）

放置后运行一次：
  npm run assets
脚本会优先用本目录下的 PNG（输出 /units/xxx.png），覆盖 DDragon 标准头像。

注意：
- 文件名必须和英雄英文 key 完全一致（大小写敏感）。
- 只放当前赛季需要的英雄即可，其余仍回退标准头像 / 文字 token。
- 删除文件后再次运行 npm run assets 即可还原。
