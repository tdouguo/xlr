// Cloudflare Worker for 小六壬算卦 API with Apple 风格前端页面

const positions = ["大安", "流连", "速喜", "赤口", "小吉", "空亡"];
const explanations = {
  "大安": {"运势":"大安卦象为青龙，代表最吉利之时机，万事平顺稳定，运势较好，但不宜过于急躁，应保持稳健心态，从容应对事物。","财富":"大安时期求财容易，财源稳定，可守护旧业或稳步投资，但不宜盲目扩张或高风险操作，以防因急躁导致损失。","感情":"女性在大安期间感情顺遂，与伴侣相互体贴；男性感情稳定但可能缺乏新鲜感，需主动制造浪漫和沟通以避免冷淡。","事业":"事业发展平稳，上司或合作伙伴赏识有加，但需低调行事，不要过分张扬才能长久获益，避免招致嫉妒和小人阻碍。","身体":"身体总体健康，无大碍，但需注意避免过度劳累，保持作息规律，预防因疲劳引发的亚健康问题。","行人":"所问之人平安无事，但目前可能因忙碌或心情平稳而不急于前来。"},
  "流连": {"运势":"流连卦象为玄武，象征拖延与纠缠，运势平平，诸事多有阻滞，需要耐心等待和化解矛盾。","财富":"此卦求财虽可得，但有破财之象，且易受外力影响导致损失，宜守财待机，谨慎理财。","感情":"双方沟通不畅，易出现冷战或情感纠葛，一方强势也会导致矛盾，需坦诚沟通以化解心结。","事业":"职场易遇小人或被人牵绊，上司或同事可能拖后腿，需提高警惕，稳妥推进项目。","身体":"多为因压力过大或饮食不当引起的肠胃不适，建议调节作息，注意饮食健康和心理减压。","行人":"所问之人平安，但仍在途中停留或有未了之事，尚未前来。"},
  "速喜": {"运势":"速喜卦象为朱雀，代表喜事将至，时机成熟，宜迅速行动，可抓住良机实现愿望。","财富":"财运佳，但出现先破后得或先得后破之兆，若获利需及时抽身，以免因拖延而丧失收益。","感情":"恋爱初期甜蜜热烈；交往已久则易生口舌之争，需注意沟通方式，避免因小事引发摩擦。","事业":"工作表现出色，可获得利益或嘉奖，但需要关注文件细节，避免因疏忽导致差错或遗憾。","身体":"多为小病小痛，无大碍，注意休息即可快速恢复。","行人":"所问之人已接近目的地，即将到来。"},
  "赤口": {"运势":"赤口卦象为白虎，象征争执与口舌是非，运势起伏不定，若有重大计划需果断执行，小事宜缓行。","财富":"财运大起大落，求财不易，投资需谨慎，防止因冲动交易而造成损失。","感情":"感情中易生争吵或摩擦，女方可能身体有恙，需多体谅与包容。","事业":"若从事武职或体力行业则较为顺利；从事文职、智力型工作则易遭遇阻碍，需谨慎推进。","身体":"易患胸肺、支气管问题，或有血光之灾，需警惕流行性疾病和意外伤害。","行人":"所问之人目前处境艰难或遇到纠缠，暂时无法前来。"},
  "小吉": {"运势":"小吉卦象为六合，象征和谐与吉利，运势不错，但需耐心等待，勿急于求成。","财富":"财运良好，可因他人助力而获利，宜抓住机会，但也需谨慎核实对方信息。","感情":"单身者可因他人介绍结识良缘；已有伴侣者感情顺利甜蜜，适合深化关系。","事业":"工作稳步发展，需关注财务管理及下属沟通，合理分配资源可获得更好成果。","身体":"多为肝胆及消化系统小毛病，问题不严重，注意饮食调节即可。","行人":"所问之人很快就会到来。"},
  "空亡": {"运势":"空亡卦象为勾陈，象征牵连与无果，运势低迷，多有反复和犹豫，宜多听取建议，慎重决策。","财富":"求财艰难，宜守财为主，不宜冒进投资，以免损失进一步扩大。","感情":"易因第三者或外部因素发生争执和矛盾，需加强沟通与信任，避免互相猜忌。","事业":"工作难以推进，易遭小人陷害或因他人问题受牵连，需谨慎处理职场人际关系。","身体":"易出现脾胃、神经系统方面问题，或有罕见病症可能，建议及时就医和调养。","行人":"所问之人在途中遇到困难或灾厄，暂无法顺利到来。"}
};

// 计算三爻卦象
function calcGua(nums) {
  let idx = (nums[0] - 1) % positions.length;
  const result = [positions[idx]];
  for (let i = 1; i < nums.length; i++) {
    idx = (idx + nums[i]) % positions.length;
    result.push(positions[idx]);
  }
  return result;
}

// 生成整体结论
function generateSummary(gua) {
  const count = {};
  gua.forEach(g => count[g] = (count[g] || 0) + 1);
  const main = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  return `此次卦象以“${main}”为主，建议结合对应卦象的解读，取其精华，避其偏颇，稳中求进。`;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  // 如果是页面请求，返回前端 HTML
  if (request.method === 'GET' && url.pathname === '/') {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>小六壬算卦</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; background: #f2f2f7; color: #1c1c1e; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); padding: 24px; }
    h1 { font-size: 28px; text-align: center; margin-bottom: 24px; font-weight: 600; }
    .inputs input[type=number] { width: 30%; margin-right: 3%; padding: 12px 8px; border: none; background: #f2f2f7; border-radius: 12px; font-size: 18px; text-align: center; }
    .inputs input[type=number]:last-child { margin-right: 0; }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0; }
    .checkbox-group label { display: inline-flex; align-items: center; padding: 8px 12px; background: #f2f2f7; border-radius: 16px; font-size: 14px; cursor: pointer; }
    .checkbox-group input[type=checkbox] { accent-color: #007aff; margin-right: 6px; width: 18px; height: 18px; }
    .toggle { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .toggle input { width: 0; height: 0; opacity: 0; }
    .slider { position: relative; width: 40px; height: 22px; background: #ccc; border-radius: 12px; transition: background 0.3s; }
    .slider::before { content: ""; position: absolute; top: 1px; left: 1px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    .toggle input:checked + .slider { background: #007aff; }
    .toggle input:checked + .slider::before { transform: translateX(18px); }
    button { width: 100%; padding: 16px; background: #007aff; color: #fff; border: none; border-radius: 14px; font-size: 18px; font-weight: 500; cursor: pointer; box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
    button:active { box-shadow: 0 3px 6px rgba(0,0,0,0.2); }
    .result { margin-top: 32px; padding: 20px; background: #f9f9f9; border-radius: 14px; }
    .result p { margin: 12px 0; font-size: 16px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>小六壬算卦</h1>
    <div class="inputs">
      <input id="num1" type="number" placeholder="第一个" min="1">
      <input id="num2" type="number" placeholder="第二个" min="1">
      <input id="num3" type="number" placeholder="第三个" min="1">
    </div>
    <div class="checkbox-group">        
      <label><input type="checkbox" value="运势" checked>运势</label>
      <label><input type="checkbox" value="财富" checked>财富</label>
      <label><input type="checkbox" value="感情" checked>感情</label>
      <label><input type="checkbox" value="事业" checked>事业</label>
      <label><input type="checkbox" value="身体" checked>身体</label>
      <label><input type="checkbox" value="行人" checked>行人</label>
    </div>
    <div class="toggle">
      <label>整体结论</label>
      <input id="withSummaryToggle" type="checkbox">
      <span class="slider"></span>
    </div>
    <button onclick="submitGua()">算  卦</button>
    <div class="result" id="result"></div>
  </div>
  <script>
    async function submitGua() {
      const nums = [
        parseInt(document.getElementById('num1').value),
        parseInt(document.getElementById('num2').value),
        parseInt(document.getElementById('num3').value)
      ];
      const categories = Array.from(document.querySelectorAll('.checkbox-group input[type=checkbox]:checked'))
        .map(cb => cb.value);
      const with_summary = document.getElementById('withSummaryToggle').checked;
      const res = await fetch('/api/算卦', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nums, categories, with_summary })
      });
      const data = await res.json();
      const container = document.getElementById('result');
      if (data.error) return container.innerHTML = `<p style="color:red">${data.error}</p>`;
      let html = `<p><strong>卦象：</strong>${data.gua.join('，')}</p>`;
      categories.forEach(cat => html += `<p><strong>${cat}：</strong>${data.answers[cat]}</p>`);
      if (with_summary) html += `<p><strong>整体结论：</strong>${data.summary}</p>`;
      container.innerHTML = html;
    }
  </script>
</body>
</html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  // 算卦 API
  if (request.method === 'POST' && url.pathname === '/api/算卦') {
    let data;
    try { data = await request.json(); } catch { return new Response(JSON.stringify({ error: '无效的 JSON' }), { status:400, headers:{ 'Content-Type':'application/json' } }); }
    const { nums, categories, with_summary } = data;
    if (!Array.isArray(nums) || nums.length !== 3 || nums.some(n => typeof n !== 'number')) {
      return new Response(JSON.stringify({ error:'nums 必须是包含三个数字的数组' }), { status:400, headers:{ 'Content-Type':'application/json' } });
    }
    const gua = calcGua(nums);
    const answers = {};
    categories.forEach(cat => { answers[cat] = explanations[gua[0]][cat] || ''; });
    const result = { gua, answers };
    if (with_summary) result.summary = generateSummary(gua);
    return new Response(JSON.stringify(result,null,2), { headers:{ 'Content-Type':'application/json' } });
  }
  return new Response('404 Not Found', { status:404 });
}
