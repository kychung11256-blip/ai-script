const http = require("http");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI剧集脚本生成器</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: sans-serif; background: #0f0f0f; color: #fff; min-height: 100vh; padding: 30px 20px; }
  h1 { text-align: center; font-size: 24px; margin-bottom: 8px; }
  p.sub { text-align: center; color: #888; margin-bottom: 30px; font-size: 14px; }
  .form { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
  label { font-size: 13px; color: #aaa; margin-bottom: 4px; display: block; }
  input, select { width: 100%; padding: 10px 14px; background: #1e1e1e; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 14px; }
  button { padding: 14px; background: #e05a00; border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; }
  button:hover { background: #ff6a10; }
  button:disabled { background: #555; cursor: not-allowed; }
  #result { max-width: 600px; margin: 30px auto 0; background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; white-space: pre-wrap; line-height: 1.8; font-size: 14px; display: none; }
  #loading { text-align: center; color: #e05a00; margin-top: 20px; display: none; }
</style>
</head>
<body>
<h1>AI剧集脚本生成器</h1>
<p class="sub">输入题材，一键生成完整剧集脚本</p>
<div class="form">
  <div>
    <label>剧集题材</label>
    <input id="genre" placeholder="例如：都市爱情、古装悬疑、职场奋斗" />
  </div>
  <div>
    <label>主角设定</label>
    <input id="character" placeholder="例如：28岁女律师，独立强势但内心脆弱" />
  </div>
  <div>
    <label>故事背景</label>
    <input id="setting" placeholder="例如：现代上海，律师事务所" />
  </div>
  <div>
    <label>这一集的核心冲突</label>
    <input id="conflict" placeholder="例如：发现男主是自己的对手律师" />
  </div>
  <div>
    <label>风格</label>
    <select id="style">
      <option>甜宠轻松</option>
      <option>虐心催泪</option>
      <option>悬疑紧张</option>
      <option>搞笑幽默</option>
      <option>热血燃情</option>
    </select>
  </div>
  <button id="btn" onclick="generate()">生成这一集脚本</button>
</div>
<div id="loading">正在创作中，约需30秒...</div>
<div id="result"></div>
<script>
async function generate() {
  const genre = document.getElementById('genre').value;
  const character = document.getElementById('character').value;
  const setting = document.getElementById('setting').value;
  const conflict = document.getElementById('conflict').value;
  const style = document.getElementById('style').value;
  if (!genre || !character || !conflict) { alert('请填写题材、主角设定和核心冲突'); return; }
  document.getElementById('btn').disabled = true;
  document.getElementById('loading').style.display = 'block';
  document.getElementById('result').style.display = 'none';
  const res = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ genre, character, setting, conflict, style })
  });
  const data = await res.json();
  document.getElementById('loading').style.display = 'none';
  document.getElementById('btn').disabled = false;
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').innerText = data.script;
}
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }
  if (req.method === "POST" && req.url === "/generate") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const { genre, character, setting, conflict, style } = JSON.parse(body);
      const prompt = `你是一位专业的中国网络剧编剧。请根据以下设定，写一集完整的网络剧剧本。题材：${genre}，主角：${character}，背景：${setting}，本集核心冲突：${conflict}，风格：${style}。要求约3000字，包含完整场景描述、人物对白、内心独白，分场次，结尾留悬念。请直接开始写剧本：`;
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const script = data.content[0].text;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ script }));
    });
    return;
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log("服务器启动成功");
});
