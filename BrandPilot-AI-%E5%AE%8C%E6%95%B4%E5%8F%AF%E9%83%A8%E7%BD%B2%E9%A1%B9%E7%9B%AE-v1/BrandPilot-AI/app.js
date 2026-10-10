/* BrandPilot AI — no third-party JS dependencies; inputs stay in browser until generation. */
(() => {
  'use strict';
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const html = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const str = (x, fallback = '待补充') => html(typeof x === 'string' && x.trim() ? x : fallback);
  const arr = (x) => Array.isArray(x) ? x : [];
  const title = (text) => `<div class="subheading">${str(text)}</div>`;
  const list = (items) => `<ul class="clean-list">${arr(items).map(t => `<li><span class="list-dot"></span><span>${str(t)}</span></li>`).join('')}</ul>`;
  const state = { report: window.BRANDPILOT_SAMPLE, mode: 'sample', tab: 'overview', generatedAt: null, model: null, busy: false, lastBrief: null, error: null };
  let toastTimer;

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el.classList.remove('show'), 3500);
  }
  function getBrief() {
    const ids = ['brand','industry','product','sellingPoints','audience','objective','budget','market','competitors','brandTone','notes'];
    const data = Object.fromEntries(ids.map(id => [id, ($(`#${id}`)?.value || '').trim()]));
    data.channels = $$('#channels input:checked').map(el => el.value);
    return data;
  }
  function setBrief(values) {
    for (const [key, value] of Object.entries(values)) {
      if (key === 'channels') continue;
      const el = $(`#${key}`);
      if (el) el.value = value;
    }
    $$('#channels input').forEach(c => c.checked = arr(values.channels).includes(c.value));
  }
  function restoreSample() { setBrief(window.BRANDPILOT_EXAMPLE_BRIEF); toast('已填入虚构品牌的示例需求'); }
  function clearBrief() {
    ['brand','product','sellingPoints','audience','budget','market','competitors','notes'].forEach(id => { const el = $(`#${id}`); if (el) el.value = ''; });
    $('#industry').value = '消费电子'; $('#objective').value = '新品上市与品牌认知'; $('#brandTone').value = '年轻、专业、有温度';
    $$('#channels input').forEach(el => el.checked = false); toast('表单已清空');
  }
  async function checkHealth() {
    try {
      const result = await fetch('/api/health', {cache:'no-store'});
      if (!result.ok) throw Error('failed');
      const data = await result.json();
      $('#apiStatus').className = `status-pill ${data.configured ? 'ready' : 'unready'}`;
      $('#apiStatus').innerHTML = `<span class="status-dot"></span>${data.configured ? `AI 已就绪 · ${html(data.model || '')}` : 'AI 服务待配置'}`;
      $('#apiStatus').title = data.configured ? '已检测到服务端 API Key' : '要启用实时生成功能，请在部署环境配置 AI_API_KEY';
    } catch {
      $('#apiStatus').className = 'status-pill unready';
      $('#apiStatus').innerHTML = '<span class="status-dot"></span>服务状态未知';
    }
  }
  function renderOverview(r) {
    const o = r.overview || {}, m = r.meta || {};
    return `<div class="tab-panel"><div class="section-caption">STRATEGIC OVERVIEW</div><h2 class="panel-h2">营销策略总览</h2><p class="panel-lead">从品牌困境出发，明确核心机会与传播主张。</p>
      <div class="feature-card"><div class="feature-label">${icon('sparkles')} BIG IDEA · 核心创意</div><strong>${str(o.bigIdea)}</strong><p>${str(m.strategicAngle, '')}</p></div>
      <div class="mini-cards"><div class="mini-card"><div class="tiny-heading">${icon('target')} 核心挑战</div><p>${str(o.challenge)}</p></div><div class="mini-card"><div class="tiny-heading">${icon('chart')} 市场机会（假设）</div><p>${str(o.opportunity)}</p></div></div>
      ${title('三步策略主线')}<ol class="step-list">${arr(o.threeMoves).map((t,i)=>`<li><i>${String(i+1).padStart(2,'0')}</i><span>${str(t)}</span></li>`).join('')}</ol>
      ${title('关键假设与待验证点')}${list(o.assumptions)}<div class="note-card">${icon('info')} ${str(m.confidenceNote, 'AI 内容应结合真实市场调研进一步验证。')}</div></div>`;
  }
  function persona(p, type) {
    const primary = type === 'primary';
    return `<div class="persona ${primary ? 'primary':'secondary'}"><div class="persona-head"><div class="persona-avatar">${primary ? 'A':'B'}</div><div><h4>${str(p?.name)}</h4><p>${str(p?.age)} · ${primary?'核心人群':'拓展人群'}</p></div></div><p>${str(p?.motivation)}</p><div class="tagline-label">主要困扰</div><div class="small-pills">${arr(p?.frictions).map(v=>`<span>${str(v)}</span>`).join('')}</div><div class="tagline-label" style="margin-top:12px">决策触发点</div><div class="small-pills">${arr(p?.triggers).map(v=>`<span>${str(v)}</span>`).join('')}</div><div class="quote">传播信息：${str(p?.message)}</div></div>`;
  }
  function renderAudience(r) {
    const a = r.audience || {};
    return `<div class="tab-panel"><div class="section-caption">AUDIENCE INTELLIGENCE</div><h2 class="panel-h2">从真实场景理解用户</h2><p class="panel-lead">用户画像属于基于 Brief 的策略推测，需用访谈、评论和真实数据验证。</p>${persona(a.primary, 'primary')}${persona(a.secondary, 'secondary')}${title('消费者决策旅程')}<div class="journey-grid">${arr(a.journey).map(j=>`<div class="journey"><strong>${str(j.stage)}</strong><p><b>关注：</b>${str(j.mindset)}</p><p><b>触点：</b>${str(j.touchpoint)}</p><p><b>内容：</b>${str(j.content)}</p></div>`).join('')}</div></div>`;
  }
  function renderStrategy(r) {
    const s = r.strategy || {}, channels = arr(s.channels), colors = ['#796cf6','#44bdd6','#f8ab71','#a98bf3','#7fb7a4'];
    const totals = channels.reduce((x, c) => x + (Number(c.budgetPercent) || 0),0);
    const numeric = channels.map(c => Math.max(0, Number(c.budgetPercent) || 0));
    let cursor = 0;
    const gradients = numeric.map((x,i)=>{
      const start = totals ? cursor / totals * 100 : 0; cursor += x; const end = totals ? cursor / totals * 100 : 0;
      return `${colors[i%colors.length]} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    });
    const background = gradients.length ? `conic-gradient(${gradients.join(',')})` : '#e9e8ff';
    return `<div class="tab-panel"><div class="section-caption">CHANNEL & POSITIONING</div><h2 class="panel-h2">有重点的渠道组合</h2><p class="panel-lead">建立品牌定位，区分各渠道角色，并用建议预算占比支持执行。</p>
    <div class="feature-card"><div class="feature-label">BRAND POSITIONING · 品牌定位</div><strong>${str(s.positioning)}</strong><p>主张：${str(s.coreMessage)}</p></div>
    <div class="mini-cards"><div class="mini-card"><div class="tiny-heading">核心 Slogan</div><p>${str(s.slogan)}</p></div><div class="mini-card"><div class="tiny-heading">传播主题</div><p>${str(s.campaignTheme)}</p></div></div>${title('建议预算分配')}
    <div class="budget-summary"><div class="donut" style="background:${background}"><div class="donut-center"><strong>${totals || 0}%</strong><span>建议占比合计</span></div></div><div class="budget-legend">${channels.map((c,i)=>`<div class="budget-legend-line"><span class="legend-dot" style="background:${colors[i%colors.length]}"></span>${str(c.name)}<b>${Number.isFinite(Number(c.budgetPercent))?html(c.budgetPercent):0}%</b></div>`).join('')}</div></div>
    ${title('渠道角色与具体战术')}${channels.map(c=>`<div class="channel-item"><div class="channel-item-title"><strong>${str(c.name)}</strong><span>建议 ${str(c.budgetPercent,'0')}%</span></div><p>${str(c.role)}</p>${list(c.tactics)}<p><b>建议关注：</b>${str(c.kpi)}</p></div>`).join('')}
    ${title('差异化表达')}${list(s.differentiators)}<div class="note-card">${icon('info')} ${str(s.budgetNotes)}${totals!==100?' 注意：模型给出的预算比例合计不是100%，执行前请人工校正。':''}</div></div>`;
  }
  function renderCreative(r) {
    const c = r.creative || {}, x = c.xiaohongshu || {}, d = c.douyin || {};
    return `<div class="tab-panel"><div class="section-caption">AIGC CONTENT STUDIO</div><h2 class="panel-h2">从策略到可制作的创意</h2><p class="panel-lead">提供内容初稿和拍摄思路，发布前需审核事实、授权和平台规则。</p>
    <div class="creative-piece"><div class="creative-piece-header"><strong>种草图文 / 笔记</strong><span class="platform-tag">小红书风格</span></div><div class="creative-piece-body"><h4>${str(x.title)}</h4><p>${str(x.body)}</p><p class="hashtags">${arr(x.hashtags).map(str0 => str(str0)).join('　')}</p><p><b>画面建议：</b>${str(x.visualDirection)}</p></div></div>
    <div class="creative-piece"><div class="creative-piece-header"><strong>30 秒创意短视频</strong><span class="platform-tag">竖屏短视频</span></div><div class="creative-piece-body"><h4>${str(d.hook)}</h4>${arr(d.storyboard).map(s=>`<div class="script-row"><span>${str(s.seconds)}</span><div>${str(s.scene)}</div></div>`).join('')}<p><b>视频标题/配文：</b>${str(d.caption)}</p><p><b>CTA：</b>${str(d.cta)}</p></div></div>
    ${title('广告短文案')}${arr(c.adCopies).map(a=>`<div class="ad-copy"><small>${str(a.angle)}</small><h4>${str(a.headline)}</h4><p>${str(a.body)}</p></div>`).join('')}</div>`;
  }
  function renderExecution(r) {
    const e = r.execution || {};
    return `<div class="tab-panel"><div class="section-caption">ACTION ROADMAP</div><h2 class="panel-h2">7 天执行排期</h2><p class="panel-lead">从需求确认、创意制作到首轮试投与复盘，明确每个节点的责任与交付物。</p><div class="day-list">${arr(e.days).map(d=>`<div class="day"><div class="day-marker">${str(d.day)}</div><div class="day-content"><h4>${str(d.objective)}</h4>${list(d.tasks)}<p>建议协作：${str(d.owner)}</p><div class="day-bottom">交付物：${str(d.deliverable)}</div></div></div>`).join('')}</div>${title('上线前检查')}${list(e.checklist)}</div>`;
  }
  function renderMeasurement(r) {
    const m = r.measurement || {};
    return `<div class="tab-panel"><div class="section-caption">MEASUREMENT & LEARNING</div><h2 class="panel-h2">让方案可以复盘和迭代</h2><p class="panel-lead">关注能够指导下一步决策的指标；所有目标值应由真实基线确定。</p>
    <div class="feature-card"><div class="feature-label">${icon('pulse')} NORTH STAR METRIC</div><strong>${str(m.northStar)}</strong></div>
    ${title('建议监控指标')}${arr(m.metrics).map(x=>`<div class="metric"><div class="metric-head"><strong>${str(x.name)}</strong><span>${str(x.reviewCadence)}</span></div><p>${str(x.definition)}</p><p><b>评估方式：</b>${str(x.targetLogic)}</p></div>`).join('')}
    ${title('风险预警与应对')}${arr(m.risks).map(x=>`<div class="risk"><strong>${str(x.risk)}</strong><p>预警信号：${str(x.signal)}</p><p>建议措施：${str(x.mitigation)}</p></div>`).join('')}
    ${title('建议 A/B 测试')}${arr(m.experiments).map(x=>`<div class="metric"><strong>${str(x.hypothesis)}</strong><p>方案：${str(x.variants)}</p><p>判断标准：${str(x.successCriterion)}</p></div>`).join('')}</div>`;
  }
  const views = {overview:renderOverview,audience:renderAudience,strategy:renderStrategy,creative:renderCreative,execution:renderExecution,measurement:renderMeasurement};
  function setTab(tab) {
    state.tab = views[tab] ? tab : 'overview';
    $$('#reportTabs .tab').forEach(el => {
      const active = el.dataset.tab === state.tab;
      el.classList.toggle('active', active); el.setAttribute('aria-selected', String(active));
    });
    if (state.busy || state.error) return;
    $('#reportBody').innerHTML = views[state.tab](state.report);
  }
  function renderReport() {
    state.error = null;
    const m = state.report.meta || {};
    $('#reportTitle').innerHTML = `<span class="report-overline">CAMPAIGN BLUEPRINT</span><h3>${str(m.title)}</h3><p>${str(m.oneLiner)}</p>`;
    const isReal = state.mode === 'real';
    $('#reportStatus').className = `report-status ${isReal ? 'real' : ''}`;
    $('#reportStatus').innerHTML = `<span class="sample-label">${icon(isReal ? 'check':'info')} ${isReal ? 'AI 实时生成 · 已完成':'预设示例报告 · 非实时 AI 生成'}</span><span class="status-detail">${isReal ? `${html(state.model || 'AI')} · ${new Date(state.generatedAt).toLocaleString('zh-CN')}`:'用于展示应用功能与版式'}</span>`;
    $('#reportFootnote').textContent = isReal ? (state.report.disclaimer || '由 AI 基于输入生成，正式投放前请人工验证。') : '虚构演示案例，不代表真实研究、实际投放或模型在线输出。';
    setTab(state.tab);
  }
  function showLoading() {
    $('#reportBody').innerHTML = `<div class="loading-panel"><div class="loading-orb">${icon('sparkles')}</div><h3>AI 正在构建营销方案</h3><p>正在请求模型完成 Brief 分析、策略规划和创意内容生成。此过程可能需要 20–60 秒。</p><div class="loading-steps"><span>需求解析</span><span>用户洞察</span><span>整合策略</span><span>AIGC 内容</span><span>执行计划</span></div></div>`;
    $('#reportStatus').className='report-status';
    $('#reportStatus').innerHTML=`<span class="sample-label">${icon('refresh')} 正在等待模型返回结果</span><span class="status-detail">不会使用预设报告冒充生成结果</span>`;
  }
  function showError(message) {
    state.error = message;
    $('#reportStatus').className='report-status';
    $('#reportStatus').innerHTML=`<span class="sample-label">${icon('info')} 生成未完成</span><span class="status-detail">未生成新报告</span>`;
    $('#reportBody').innerHTML = `<div class="error-panel"><div class="error-bubble">!</div><h3>这次没有生成成功</h3><p>${str(message)}</p><button type="button" id="restoreSampleReport">查看预设示例报告</button></div>`;
    $('#restoreSampleReport').addEventListener('click',()=>{ state.mode='sample';state.report=window.BRANDPILOT_SAMPLE;state.tab='overview';renderReport(); });
  }
  async function generate(e) {
    e.preventDefault(); if (state.busy) return;
    const brief = getBrief();
    if (!brief.brand || !brief.product || !brief.audience || !brief.objective) { toast('请填写品牌名称、产品介绍、目标消费者和营销目标'); return; }
    if (!brief.channels.length) { toast('请至少选择一个营销渠道'); return; }
    state.busy = true; state.error=null;
    const btn = $('#generateButton'); btn.disabled = true;
    btn.querySelector('span').textContent = 'AI 正在生成中...';
    showLoading();
    $('#reportCard').scrollIntoView({behavior:'smooth',block:'start'});
    try {
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(),59000);
      let response;
      try { response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(brief),signal:controller.signal}); }
      finally {clearTimeout(timeout);}
      let payload;
      try {payload=await response.json();}catch{throw new Error('服务器返回了无法解析的结果。');}
      if (!response.ok) throw new Error(payload.error || `服务器出错：HTTP ${response.status}`);
      if (!payload.report) throw new Error('服务器没有返回策略报告。');
      state.report=payload.report; state.mode='real'; state.generatedAt=payload.generatedAt;state.model=payload.model;state.lastBrief=brief;state.tab='overview';
      renderReport();toast('AI 营销方案生成成功！');
    } catch(error) {
      showError(error.name === 'AbortError' ? '请求等待超时，请重试或检查模型接口响应时间。' : (error.message || '出现未知错误，请稍后重试。'));
      toast('尚未获得真实 AI 结果');
    } finally {
      state.busy=false; btn.disabled=false; btn.querySelector('span').textContent='生成 AI 营销方案';
    }
  }
  function reportToMarkdown(r, mode) {
    const o = r.overview||{},m=r.meta||{},a=r.audience||{},s=r.strategy||{},c=r.creative||{},e=r.execution||{},x=r.measurement||{};
    const bullets = items => arr(items).map(i=>`- ${i}`).join('\n');
    const lines = [
      `# ${m.title||'营销策略报告'}`,``,`${m.oneLiner||''}`,``,
      `> 报告来源：${mode==='sample'?'预设虚构示例（非实时AI结果）':'服务端 AI 模型实时生成'}`,
      `> ${r.disclaimer||'AI 辅助生成，仅供策略初稿使用；数据和结论需要人工核验。'}`,``,
      `## 一、营销策略总览`,``,`**核心创意：${o.bigIdea||''}**`,``,`**挑战：** ${o.challenge||''}`,``,`**机会：** ${o.opportunity||''}`,``,`**策略主线**`,bullets(o.threeMoves),``,`**关键假设**`,bullets(o.assumptions),``,
      `## 二、目标用户洞察`,``,
      ...['primary','secondary'].flatMap((k,i)=>{const p=a[k]||{};return [`### ${i?'拓展':'核心'}人群：${p.name||''}`,`- 年龄：${p.age||''}`,`- 动机：${p.motivation||''}`,`- 痛点：${arr(p.frictions).join('；')}`,`- 决策触发：${arr(p.triggers).join('；')}`,`- 沟通话术：${p.message||''}`,``];}),
      `### 用户决策旅程`,...arr(a.journey).map(j=>`- **${j.stage||''}**：${j.mindset||''}；触点：${j.touchpoint||''}；内容：${j.content||''}`),``,
      `## 三、品牌定位与渠道策略`,``,`**定位：** ${s.positioning||''}`,``,`**主张：** ${s.coreMessage||''}`,``,`**Slogan：** ${s.slogan||''}`,``,`**主题：** ${s.campaignTheme||''}`,``,`**差异化表达**`,bullets(s.differentiators),``,
      ...arr(s.channels).flatMap(ch=>[`### ${ch.name||''}（建议预算 ${ch.budgetPercent||0}%）`,`${ch.role||''}`,bullets(ch.tactics),`建议关注：${ch.kpi||''}`,``]),
      `预算说明：${s.budgetNotes||''}`,``,
      `## 四、AIGC 创意内容`,``,`### 小红书风格内容`,``,`**${c.xiaohongshu?.title||''}**`,``,c.xiaohongshu?.body||'',``,arr(c.xiaohongshu?.hashtags).join(' '),``,`画面建议：${c.xiaohongshu?.visualDirection||''}`,``,
      `### 短视频脚本`,``,`**开头：** ${c.douyin?.hook||''}`,``,...arr(c.douyin?.storyboard).map(v=>`- **${v.seconds||''}**：${v.scene||''}`),``,`配文：${c.douyin?.caption||''}`,``,`CTA：${c.douyin?.cta||''}`,``,`### 广告短文案`,...arr(c.adCopies).map(v=>`- **${v.angle||''}｜${v.headline||''}**：${v.body||''}`),``,
      `## 五、7天执行计划`,``,...arr(e.days).flatMap(v=>[`### ${v.day||''}：${v.objective||''}`,bullets(v.tasks),`责任建议：${v.owner||''}`,`交付物：${v.deliverable||''}`,``]),`**上线检查**`,bullets(e.checklist),``,
      `## 六、效果衡量与风险`,``,`**北极星指标：** ${x.northStar||''}`,``,`**建议跟踪指标**`,...arr(x.metrics).map(v=>`- **${v.name||''}**：${v.definition||''}；评估：${v.targetLogic||''}；复盘：${v.reviewCadence||''}`),``,`**风险与应对**`,...arr(x.risks).map(v=>`- **${v.risk||''}**：预警 ${v.signal||''}；应对 ${v.mitigation||''}`),``,`**A/B测试**`,...arr(x.experiments).map(v=>`- ${v.hypothesis||''}；对比：${v.variants||''}；成功标准：${v.successCriterion||''}`),``,
      `---`,`AI 辅助初稿，正式使用前请由负责人进行事实校验、法务与营销合规审核。`
    ];
    return lines.join('\n');
  }
  async function copyReport() {
    if (state.busy || state.error) {toast('请等待生成完成，或返回示例报告');return;}
    const markdown=reportToMarkdown(state.report,state.mode);
    try {await navigator.clipboard.writeText(markdown);toast('已复制完整营销方案');}
    catch { const ta=document.createElement('textarea');ta.value=markdown;document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?'已复制完整营销方案':'复制未成功，请使用导出按钮'); }
  }
  function downloadReport() {
    if (state.busy || state.error) {toast('请等待生成完成，或返回示例报告');return;}
    const brief = state.lastBrief?.brand || (state.mode==='sample' ? 'AURA-Pods' : 'BrandPilot');
    const filename = `${brief.replace(/[^a-z0-9\u4e00-\u9fa5-]/gi,'-').slice(0,30)}-AI营销方案${state.mode==='sample'?'-预设示例':''}.md`;
    const blob = new Blob(['\ufeff',reportToMarkdown(state.report,state.mode)],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('已导出 Markdown 营销报告');
  }
  function modal(open) { $('#aboutModal').hidden = !open; document.body.style.overflow=open?'hidden':''; }
  function init() {
    restoreSample(); renderReport(); checkHealth();
    $('#briefForm').addEventListener('submit',generate);
    $('#resetSample').addEventListener('click',restoreSample);
    $('#clearForm').addEventListener('click',clearBrief);
    $('#copyReport').addEventListener('click',copyReport);
    $('#downloadReport').addEventListener('click',downloadReport);
    $$('#reportTabs .tab').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));
    $('#openAbout').addEventListener('click',()=>modal(true));
    $('#closeAbout').addEventListener('click',()=>modal(false));
    $('#modalOkay').addEventListener('click',()=>modal(false));
    $('#aboutModal').addEventListener('click',(e)=>{if(e.target.id==='aboutModal')modal(false);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')modal(false);});
    $('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
    $$('.nav-item').forEach(nav=>nav.addEventListener('click',()=>{
      $$('.nav-item').forEach(b=>b.classList.toggle('active',b===nav));
      $('#sidebar').classList.remove('open');
      const action=nav.dataset.nav;
      if(action==='about') modal(true);
      else (action==='report'?$('#reportCard'):$('#workspace')).scrollIntoView({behavior:'smooth',block:'start'});
    }));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);else init();
})();
