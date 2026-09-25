// 海克斯典籍（/legends）上线开关
//
// 背景：板块内容已建好但尚未经明同学审核，2026-09-26 部署时因打包 HEAD 被误带上线，
// 故加此开关统一收口。当前为 false —— 路由返回 404、sitemap 不收录、导航不显示入口。
//
// 上线步骤（内容审核通过后）：
//   1. 把下面的 LEGENDS_LIVE 改为 true
//   2. 提交并部署
//   3. 外网验证 https://yilangames.com/legends 返回 200
export const LEGENDS_LIVE = false;
