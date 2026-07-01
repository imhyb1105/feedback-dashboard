// Supabase Edge Function: 新反馈邮件通知
// 触发方式: Database Webhook on feedbacks INSERT
// 直接部署到 Supabase Edge Functions，无需外部导入

const SMTP_HOST = "smtp.qq.com";
const SMTP_PORT = 465;
const SMTP_USER = "408793802@qq.com";
const SMTP_PASS = "nclfspubmjzacbab";
const TO_EMAIL = "408793802@qq.com";

const PROJECT_NAMES: Record<string, string> = {
  "bank-rec": "银行对账工具",
  "tax-tool": "个税决策对比工具",
  "tax-calc": "税金计算器",
  "fin-report": "财务报表数据分析",
  "cn-football-sim": "国足世界杯闯关模拟器",
};
const TYPE_NAMES: Record<string, string> = {
  bug: "Bug报告",
  feature: "功能建议",
  improvement: "改进建议",
  other: "其他",
};

function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function smtpRead(conn: Deno.TlsConn): Promise<string> {
  const buf = new Uint8Array(8192);
  const n = await conn.read(buf);
  if (n === null) throw new Error("SMTP connection closed");
  return new TextDecoder().decode(buf.subarray(0, n));
}

async function smtpCmd(conn: Deno.TlsConn, cmd: string, expect: string): Promise<string> {
  if (cmd) {
    await conn.write(new TextEncoder().encode(cmd + "\r\n"));
  }
  const resp = await smtpRead(conn);
  if (!resp.startsWith(expect)) throw new Error(`SMTP ${cmd.split(" ")[0]}: ${resp.trim()}`);
  return resp;
}

async function sendEmail(subject: string, body: string): Promise<void> {
  const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT });

  // Server greeting
  await smtpCmd(conn, "", "220");

  // EHLO
  await smtpCmd(conn, "EHLO feedback", "250");

  // AUTH LOGIN
  await smtpCmd(conn, "AUTH LOGIN", "334");

  // Username
  await smtpCmd(conn, btoa(SMTP_USER), "334");

  // Password
  await smtpCmd(conn, btoa(SMTP_PASS), "235");

  // MAIL FROM
  await smtpCmd(conn, `MAIL FROM:<${SMTP_USER}>`, "250");

  // RCPT TO
  await smtpCmd(conn, `RCPT TO:<${TO_EMAIL}>`, "250");

  // DATA
  await smtpCmd(conn, "DATA", "354");

  // Email content
  const msg = [
    `From: =?UTF-8?B?${base64Encode("反馈系统通知")}?= <${SMTP_USER}>`,
    `To: ${TO_EMAIL}`,
    `Subject: =?UTF-8?B?${base64Encode(subject)}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    ...base64Encode(body).match(/.{1,76}/g)!,
    "",
    ".",
  ].join("\r\n");

  await smtpCmd(conn, msg, "250");

  // QUIT
  await conn.write(new TextEncoder().encode("QUIT\r\n"));
  conn.close();
}

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const record = payload.record || payload;

    const projectName = PROJECT_NAMES[record.project] || record.project;
    const typeName = TYPE_NAMES[record.type] || record.type;
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
      : "未知";

    const subject = `[${projectName}] 新${typeName}: ${record.title}`;
    const body = [
      `═══════════════════`,
      `  反馈系统 · 新通知`,
      `═══════════════════`,
      ``,
      `项目: ${projectName}`,
      `类型: ${typeName}`,
      `标题: ${record.title}`,
      `内容: ${record.content}`,
      `联系方式: ${record.contact || "未提供"}`,
      `时间: ${createdAt}`,
      ``,
      `查看管理: https://feedback-dashboard-blush.vercel.app/dashboard.html`,
    ].join("\n");

    await sendEmail(subject, body);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-feedback-email error:", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
