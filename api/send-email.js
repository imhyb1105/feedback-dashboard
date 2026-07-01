// Vercel Serverless Function: 新反馈邮件通知
// 触发: Supabase pg_net → POST 到此端点
const nodemailer = require("nodemailer");

const SMTP_USER = "408793802@qq.com";
const SMTP_PASS = "nclfspubmjzacbab";

const PROJECT_NAMES = {
  "bank-rec": "银行对账工具",
  "tax-tool": "个税决策对比工具",
  "tax-calc": "税金计算器",
  "fin-report": "财务报表数据分析",
  "cn-football-sim": "国足世界杯闯关模拟器",
};
const TYPE_NAMES = {
  bug: "Bug报告",
  feature: "功能建议",
  improvement: "改进建议",
  other: "其他",
};

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { record } = req.body;
    if (!record || !record.project || !record.title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const projectName = PROJECT_NAMES[record.project] || record.project;
    const typeName = TYPE_NAMES[record.type] || record.type;
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
      : "未知";

    const subject = `[${projectName}] 新${typeName}: ${record.title}`;
    const html = `
      <div style="font-family: 'PingFang SC','Microsoft YaHei',sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#fefcf9;border-radius:10px">
        <h2 style="color:#1a3a5c;margin:0 0 16px">反馈系统 · 新通知</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 12px;color:#6b6560;width:80px">项目</td><td style="padding:8px 12px;font-weight:600">${projectName}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b6560">类型</td><td style="padding:8px 12px"><span style="background:#eef6f0;color:#1a3a5c;padding:2px 8px;border-radius:10px;font-size:.85rem">${typeName}</span></td></tr>
          <tr><td style="padding:8px 12px;color:#6b6560">标题</td><td style="padding:8px 12px;font-weight:600">${record.title}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b6560">内容</td><td style="padding:8px 12px">${record.content}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b6560">联系方式</td><td style="padding:8px 12px">${record.contact || "未提供"}</td></tr>
          <tr><td style="padding:8px 12px;color:#6b6560">时间</td><td style="padding:8px 12px">${createdAt}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e8e4e0;text-align:center">
          <a href="https://feedback-dashboard-blush.vercel.app/dashboard.html" style="color:#1a3a5c;text-decoration:none;font-weight:600">打开管理后台</a>
        </div>
      </div>`;

    const transporter = nodemailer.createTransport({
      host: "smtp.qq.com",
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_USER,
      to: "408793802@qq.com",
      subject: subject,
      html: html,
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("send-email error:", e);
    res.status(500).json({ success: false, error: e.message });
  }
};
