// ─── 读书助理页面（Reading Assistant）──────────────────────────────

async function renderReadingAssistant() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-header">
      <h2>📖 读书助理</h2>
      <div class="meta">阅读管理 · 打卡追踪 · 笔记记录</div>
    </div>
    <div id="reading-stats-row" class="stat-row">
      <div class="stat-box"><div class="num">—</div><div class="label">藏书数</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">在读</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">读完</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">打卡天数</div></div>
    </div>
    <div id="reading-search" style="margin-bottom:16px;display:flex;gap:10px;">
      <input type="text" id="reading-search-input" placeholder="🔍 搜索书名/作者..."
        style="flex:1;background:var(--surface);border:1px solid var(--border);
        border-radius:8px;padding:10px 14px;color:var(--text);font-size:13px;
        outline:none;">
      <button id="reading-search-btn"
        style="background:var(--accent);color:#fff;border:none;border-radius:8px;
        padding:10px 18px;cursor:pointer;font-size:12px;font-weight:500;">搜索</button>
    </div>
    <div id="reading-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-bottom:20px;">
      <div style="text-align:center;padding:40px;color:var(--text2);font-size:13px;">⏳ 加载中...</div>
    </div>
    <button id="reading-add-btn"
      style="width:100%;background:var(--surface);border:2px dashed var(--border);
      border-radius:12px;padding:16px;color:var(--accent2);font-size:13px;
      cursor:pointer;transition:all .15s;font-weight:500;"
      onmouseover="this.style.borderColor='var(--accent)'"
      onmouseout="this.style.borderColor='var(--border)'">＋ 添加新书</button>
    <div class="footer">
      <p>Dylan Executive Dashboard · <a href="https://github.com/DylanZhao90/dylan-assistant" target="_blank">GitHub</a> · v3.0</p>
    </div>`;

  // Load data
  loadReadingStats();
  loadReadingBooks();

  // Search
  document.getElementById('reading-search-btn').onclick = () => searchReadingBooks();
  document.getElementById('reading-search-input').onkeydown = (e) => {
    if (e.key === 'Enter') searchReadingBooks();
  };

  // Add book modal
  document.getElementById('reading-add-btn').onclick = showAddBookModal;
}

async function loadReadingStats() {
  try {
    const res = await fetch('/api/reading/stats');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const row = document.getElementById('reading-stats-row');
    if (!row) return;
    const boxes = row.querySelectorAll('.stat-box .num');
    if (boxes.length >= 4) {
      boxes[0].textContent = data.total_books ?? data.total ?? '0';
      boxes[1].textContent = data.reading ?? data.in_progress ?? '0';
      boxes[2].textContent = data.finished ?? data.completed ?? '0';
      boxes[3].textContent = data.checkin_days ?? data.checkin_count ?? '0';
    }
  } catch (e) {
    console.error('读取阅读统计失败:', e);
  }
}

async function loadReadingBooks(query) {
  const grid = document.getElementById('reading-grid');
  if (!grid) return;
  try {
    let url = '/api/reading/books';
    if (query) url = '/api/reading/search?q=' + encodeURIComponent(query);
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let books = await res.json();
    // Handle both array and {books: [...]} response formats
    if (books && !Array.isArray(books)) {
      books = books.books || books.data || [];
    }
    if (!Array.isArray(books)) books = [];
    if (books.length === 0) {
      grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text2);font-size:13px;grid-column:1/-1;">📭 暂无书籍记录，点击下方「添加新书」开始吧</div>`;
      return;
    }
    grid.innerHTML = books.map(b => renderBookCard(b)).join('');
  } catch (e) {
    console.error('读取书籍列表失败:', e);
    grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--red);font-size:13px;grid-column:1/-1;">❌ 加载失败: ${e.message}</div>`;
  }
}

function renderBookCard(book) {
  const id = book.id || book.book_id || '';
  const title = book.title || book.name || '未命名';
  const author = book.author || '未知作者';
  const progress = book.progress ?? book.reading_progress ?? 0;
  const status = book.status || 'reading';
  const progressPct = Math.min(100, Math.max(0, Number(progress)));

  const statusLabel = status === 'reading' ? '在读' : status === 'finished' ? '已读完' : '未开始';
  const statusColor = status === 'reading' ? 'var(--yellow)' : status === 'finished' ? 'var(--green)' : 'var(--text2)';

  return `
    <div class="book-card" data-id="${id}"
      style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
      padding:16px;display:flex;flex-direction:column;gap:8px;
      transition:all .15s;"
      onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
      onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
      <div style="width:100%;aspect-ratio:3/4;background:linear-gradient(135deg,var(--surface2),var(--border));
        border-radius:6px;display:flex;align-items:center;justify-content:center;
        font-size:36px;color:var(--text2);">📚</div>
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:600;color:#fff;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${title}">${title}</div>
        <div style="font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${author}</div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:10px;color:var(--text2);">${statusLabel}</span>
          <span style="font-size:10px;color:var(--accent2);">${progressPct}%</span>
        </div>
        <div style="height:4px;background:var(--surface2);border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${progressPct}%;background:${statusColor};border-radius:2px;transition:width .3s;"></div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:4px;">
        <button class="reading-action-btn" data-id="${id}" data-action="checkin"
          style="flex:1;background:rgba(0,184,148,.12);color:var(--green);border:1px solid rgba(0,184,148,.25);
          border-radius:6px;padding:5px 0;font-size:11px;cursor:pointer;transition:all .12s;
          font-weight:500;">打卡</button>
        <button class="reading-action-btn" data-id="${id}" data-action="note"
          style="flex:1;background:rgba(108,92,231,.12);color:var(--accent2);border:1px solid rgba(108,92,231,.25);
          border-radius:6px;padding:5px 0;font-size:11px;cursor:pointer;transition:all .12s;
          font-weight:500;">笔记</button>
        <button class="reading-action-btn" data-id="${id}" data-action="finish"
          style="flex:1;background:rgba(253,203,110,.12);color:var(--yellow);border:1px solid rgba(253,203,110,.25);
          border-radius:6px;padding:5px 0;font-size:11px;cursor:pointer;transition:all .12s;
          font-weight:500;">读完</button>
      </div>
    </div>`;
}

// Delegate click events for reading action buttons
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.reading-action-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'checkin') handleReadingCheckin(id);
  else if (action === 'note') handleReadingNote(id);
  else if (action === 'finish') handleReadingFinish(id);
});

async function handleReadingCheckin(bookId) {
  if (!bookId) return;
  try {
    const res = await fetch('/api/reading/checkin', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ book_id: bookId, date: new Date().toISOString().split('T')[0] })
    });
    if (res.ok) {
      showToast('✅ 打卡成功！');
      loadReadingStats();
    } else {
      const err = await res.json().catch(() => ({error: '未知错误'}));
      showToast('❌ 打卡失败: ' + (err.error || err.detail || res.statusText));
    }
  } catch (e) {
    showToast('❌ 打卡失败: ' + e.message);
  }
}

async function handleReadingNote(bookId) {
  if (!bookId) return;
  showNoteModal(bookId);
}

async function handleReadingFinish(bookId) {
  if (!bookId) return;
  try {
    const res = await fetch('/api/reading/books/' + bookId, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ status: 'finished', progress: 100 })
    });
    if (res.ok) {
      showToast('✅ 已标记为读完！');
      loadReadingBooks(document.getElementById('reading-search-input')?.value || '');
      loadReadingStats();
    } else {
      const err = await res.json().catch(() => ({error: '未知错误'}));
      showToast('❌ 标记失败: ' + (err.error || err.detail || res.statusText));
    }
  } catch (e) {
    showToast('❌ 标记失败: ' + e.message);
  }
}

async function searchReadingBooks() {
  const input = document.getElementById('reading-search-input');
  if (!input) return;
  const q = input.value.trim();
  loadReadingBooks(q || undefined);
}

function showNoteModal(bookId) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--surface2,#1a1d27);border:1px solid var(--border,#252a36);border-radius:12px;padding:20px;width:90%;max-width:500px;display:flex;flex-direction:column;color:var(--text,#e4e6ef);';

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <strong style="font-size:14px;">📝 写笔记</strong>
      <span style="font-size:11px;color:var(--text2,#8b8f9e);">书籍ID: ${bookId}</span>
    </div>
    <textarea id="note-content"
      style="min-height:200px;background:var(--bg,#0a0b0f);color:var(--accent2,#a29bfe);border:1px solid var(--border,#252a36);
      border-radius:6px;padding:14px;font-family:inherit;font-size:13px;line-height:1.6;resize:vertical;"
      placeholder="写下你的读书笔记..."></textarea>
    <div id="note-status" style="font-size:11px;color:var(--text2,#8b8f9e);margin-top:8px;min-height:18px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button id="note-cancel"
        style="background:var(--surface,#12141a);color:var(--text,#e4e6ef);border:1px solid var(--border,#252a36);padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
      <button id="note-save"
        style="background:var(--accent,#6c5ce7);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">💾 保存笔记</button>
    </div>`;

  overlay.appendChild(modal);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);

  document.getElementById('note-cancel').onclick = () => overlay.remove();
  document.getElementById('note-save').onclick = async () => {
    const content = document.getElementById('note-content').value.trim();
    if (!content) { showToast('⚠️ 请输入笔记内容'); return; }
    const status = document.getElementById('note-status');
    status.textContent = '⏳ 保存中...';
    try {
      const res = await fetch('/api/reading/notes', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ book_id: bookId, content: content })
      });
      if (res.ok) {
        status.textContent = '✅ 笔记已保存！';
        status.style.color = 'var(--green)';
        setTimeout(() => overlay.remove(), 1000);
        showToast('✅ 笔记保存成功');
      } else {
        const err = await res.json().catch(() => ({error: '未知错误'}));
        status.textContent = '❌ 保存失败: ' + (err.error || err.detail || res.statusText);
        status.style.color = 'var(--red)';
      }
    } catch (e) {
      status.textContent = '❌ 保存失败: ' + e.message;
      status.style.color = 'var(--red)';
    }
  };
}

function showAddBookModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--surface2,#1a1d27);border:1px solid var(--border,#252a36);border-radius:12px;padding:20px;width:90%;max-width:460px;display:flex;flex-direction:column;color:var(--text,#e4e6ef);';

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <strong style="font-size:14px;">📚 添加新书</strong>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <label style="font-size:11px;color:var(--text2,#8b8f9e);display:block;margin-bottom:4px;">书名 *</label>
        <input id="addbook-title"
          style="width:100%;background:var(--bg,#0a0b0f);color:var(--text);border:1px solid var(--border,#252a36);
          border-radius:6px;padding:10px 12px;font-size:13px;outline:none;" placeholder="输入书名">
      </div>
      <div>
        <label style="font-size:11px;color:var(--text2,#8b8f9e);display:block;margin-bottom:4px;">作者</label>
        <input id="addbook-author"
          style="width:100%;background:var(--bg,#0a0b0f);color:var(--text);border:1px solid var(--border,#252a36);
          border-radius:6px;padding:10px 12px;font-size:13px;outline:none;" placeholder="输入作者">
      </div>
      <div>
        <label style="font-size:11px;color:var(--text2,#8b8f9e);display:block;margin-bottom:4px;">起始进度</label>
        <select id="addbook-status"
          style="width:100%;background:var(--bg,#0a0b0f);color:var(--text);border:1px solid var(--border,#252a36);
          border-radius:6px;padding:10px 12px;font-size:13px;outline:none;">
          <option value="reading">在读</option>
          <option value="wish">想读</option>
          <option value="finished">已读完</option>
        </select>
      </div>
    </div>
    <div id="addbook-status-msg" style="font-size:11px;color:var(--text2,#8b8f9e);margin-top:8px;min-height:18px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button id="addbook-cancel"
        style="background:var(--surface,#12141a);color:var(--text,#e4e6ef);border:1px solid var(--border,#252a36);padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
      <button id="addbook-save"
        style="background:var(--accent,#6c5ce7);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">添加</button>
    </div>`;

  overlay.appendChild(modal);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);

  document.getElementById('addbook-cancel').onclick = () => overlay.remove();
  document.getElementById('addbook-save').onclick = async () => {
    const title = document.getElementById('addbook-title').value.trim();
    if (!title) { showToast('⚠️ 书名不能为空'); return; }
    const author = document.getElementById('addbook-author').value.trim();
    const status = document.getElementById('addbook-status').value;
    const statusMsg = document.getElementById('addbook-status-msg');
    statusMsg.textContent = '⏳ 添加中...';
    try {
      const res = await fetch('/api/reading/books', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title, author, status })
      });
      if (res.ok) {
        statusMsg.textContent = '✅ 添加成功！';
        statusMsg.style.color = 'var(--green)';
        setTimeout(() => overlay.remove(), 800);
        loadReadingBooks(document.getElementById('reading-search-input')?.value || '');
        loadReadingStats();
      } else {
        const err = await res.json().catch(() => ({error: '未知错误'}));
        statusMsg.textContent = '❌ 添加失败: ' + (err.error || err.detail || res.statusText);
        statusMsg.style.color = 'var(--red)';
      }
    } catch (e) {
      statusMsg.textContent = '❌ 添加失败: ' + e.message;
      statusMsg.style.color = 'var(--red)';
    }
  };
}

// ─── 工作助理页面（Work Assistant）───────────────────────────────

async function renderWorkAssistant() {
  const today = new Date().toISOString().split('T')[0];

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page-header">
      <h2>💼 工作助理</h2>
      <div class="meta">飞书消息管理 · AI建议回复 · 分类处理</div>
    </div>
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);
        border-radius:8px;padding:4px 12px 4px 4px;">
        <span style="font-size:12px;color:var(--text2);padding-left:6px;">📅</span>
        <input type="date" id="work-date-picker" value="${today}"
          style="background:transparent;color:var(--text);border:none;outline:none;font-size:13px;padding:6px 4px;">
      </div>
      <button id="work-refresh-btn"
        style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;
        cursor:pointer;font-size:12px;font-weight:500;">🔄 刷新</button>
      <span id="work-loading" style="font-size:11px;color:var(--text2);display:none;">⏳ 加载中...</span>
    </div>
    <div id="work-stats-row" class="stat-row">
      <div class="stat-box"><div class="num">—</div><div class="label">今日消息数</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">待处理</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">已回复</div></div>
      <div class="stat-box"><div class="num">—</div><div class="label">已忽略</div></div>
    </div>
    <div id="work-messages"></div>
    <div class="footer">
      <p>Dylan Executive Dashboard · <a href="https://github.com/DylanZhao90/dylan-assistant" target="_blank">GitHub</a> · v3.0</p>
    </div>`;

  // Event listeners
  document.getElementById('work-date-picker').onchange = loadWorkData;
  document.getElementById('work-refresh-btn').onclick = loadWorkData;

  // Load data
  await loadWorkData();
}

async function loadWorkData() {
  const loading = document.getElementById('work-loading');
  if (loading) loading.style.display = 'inline';
  try {
    await Promise.all([loadWorkStats(), loadWorkMessages()]);
  } catch (e) {
    console.error('加载工作数据失败:', e);
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

async function loadWorkStats() {
  try {
    const res = await fetch('/api/feishu/today');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    // Handle possible response structures
    const stats = data.stats || data;
    const row = document.getElementById('work-stats-row');
    if (!row) return;
    const boxes = row.querySelectorAll('.stat-box .num');
    if (boxes.length >= 4) {
      boxes[0].textContent = stats.total ?? stats.total_messages ?? stats.message_count ?? '0';
      boxes[1].textContent = stats.pending ?? stats.unreplied ?? stats.pending_count ?? '0';
      boxes[2].textContent = stats.replied ?? stats.reply_count ?? '0';
      boxes[3].textContent = stats.ignored ?? stats.ignore_count ?? '0';
    }
  } catch (e) {
    console.error('加载今日统计失败:', e);
  }
}

async function loadWorkMessages() {
  const container = document.getElementById('work-messages');
  if (!container) return;
  const datePicker = document.getElementById('work-date-picker');
  const date = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];

  try {
    // Try today endpoint first, then fall back to messages with date filter
    let url = `/api/feishu/messages?date_from=${date}&date_to=${date}`;
    if (date === new Date().toISOString().split('T')[0]) {
      // For today, try the today endpoint first for stats, but use messages for list
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    let data = await res.json();
    // Handle various response formats
    let messages = data;
    if (messages && !Array.isArray(messages)) {
      messages = messages.messages || messages.data || messages.items || [];
    }
    if (!Array.isArray(messages)) messages = [];

    if (messages.length === 0) {
      container.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;
          padding:40px;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">📭</div>
          <div style="font-size:13px;color:var(--text2);">${date === new Date().toISOString().split('T')[0] ? '今天暂无消息' : '所选日期暂无消息'}</div>
        </div>`;
      return;
    }

    // Group by category
    const categories = {
      '技术问题': [],
      '订单问题': [],
      '供应商': [],
      '其他': []
    };

    // Category mapping
    const categoryMap = {
      'tech': '技术问题', '技术': '技术问题', 'technical': '技术问题',
      'order': '订单问题', '订单': '订单问题',
      'supplier': '供应商', '供应': '供应商',
      'other': '其他', '其他': '其他', 'general': '其他'
    };

    messages.forEach(msg => {
      const rawCat = msg.category || msg.type || '其他';
      const cat = categoryMap[rawCat.toLowerCase()] || '其他';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(msg);
    });

    // Render grouped messages
    let html = '';
    const categoryIcons = { '技术问题': '🔧', '订单问题': '📦', '供应商': '🏭', '其他': '📋' };
    const categoryColors = {
      '技术问题': 'var(--blue)',
      '订单问题': 'var(--yellow)',
      '供应商': 'var(--green)',
      '其他': 'var(--text2)'
    };

    Object.entries(categories).forEach(([catName, catMsgs]) => {
      if (catMsgs.length === 0) return;
      html += `
        <div style="margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:0 4px;">
            <span style="font-size:14px;">${categoryIcons[catName] || '📋'}</span>
            <span style="font-size:13px;font-weight:600;color:#fff;">${catName}</span>
            <span style="font-size:11px;color:var(--text2);background:var(--surface2);padding:0 8px;border-radius:10px;">${catMsgs.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${catMsgs.map(msg => renderMessageCard(msg)).join('')}
          </div>
        </div>`;
    });

    container.innerHTML = html;
  } catch (e) {
    console.error('加载消息列表失败:', e);
    container.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;
        padding:40px;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">❌</div>
        <div style="font-size:13px;color:var(--red);">加载失败: ${e.message}</div>
      </div>`;
  }
}

function renderMessageCard(msg) {
  const id = msg.id || msg.message_id || '';
  const time = msg.time || msg.created_at || msg.timestamp || '';
  const group = msg.group || msg.group_name || msg.chat_name || '未知群组';
  const sender = msg.sender || msg.from || msg.sender_name || '未知';
  const summary = msg.content || msg.text || msg.summary || msg.message || '(无内容)';
  const suggestion = msg.ai_reply || msg.suggested_reply || msg.suggestion || '';
  const status = msg.status || 'pending';

  // Format time nicely
  let displayTime = time;
  if (time) {
    try {
      const d = new Date(time);
      if (!isNaN(d.getTime())) {
        displayTime = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (_) {}
  }

  const isReplied = status === 'replied';
  const isIgnored = status === 'ignored';
  const isPending = !isReplied && !isIgnored;

  return `
    <div class="work-message-card" data-id="${id}"
      style="background:var(--surface);border:1px solid var(--border);border-radius:10px;
      padding:14px 16px;transition:all .12s;
      ${isReplied ? 'opacity:.6;' : ''}
      ${isIgnored ? 'opacity:.4;' : ''}"
      onmouseover="this.style.borderColor='var(--accent)'"
      onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--text2);">${displayTime}</span>
          <span style="font-size:11px;color:var(--accent2);background:rgba(108,92,231,.1);padding:1px 6px;border-radius:4px;">${group}</span>
          <span style="font-size:11px;color:var(--text);">${sender}</span>
        </div>
        <div>
          ${isReplied ? '<span style="font-size:10px;color:var(--green);padding:1px 6px;border-radius:4px;background:rgba(0,184,148,.12);">✅ 已回复</span>' : ''}
          ${isIgnored ? '<span style="font-size:10px;color:var(--text2);padding:1px 6px;border-radius:4px;background:rgba(139,143,158,.12);">⏭️ 已忽略</span>' : ''}
          ${isPending ? '<span style="font-size:10px;color:var(--yellow);padding:1px 6px;border-radius:4px;background:rgba(253,203,110,.12);">⏳ 待处理</span>' : ''}
        </div>
      </div>
      <div style="font-size:12px;color:var(--text);line-height:1.5;margin-bottom:8px;padding:0 2px;">
        ${summary.length > 200 ? summary.substring(0, 200) + '...' : summary}
      </div>
      ${suggestion ? `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin-bottom:8px;">
        <div style="font-size:10px;color:var(--accent2);margin-bottom:3px;">🤖 AI 建议回复</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.5;">${suggestion}</div>
      </div>` : ''}
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        ${isPending ? `
        <button class="work-action-btn" data-id="${id}" data-action="reply"
          style="background:rgba(0,184,148,.12);color:var(--green);border:1px solid rgba(0,184,148,.25);
          border-radius:6px;padding:5px 14px;font-size:11px;cursor:pointer;font-weight:500;">回复</button>
        <button class="work-action-btn" data-id="${id}" data-action="ignore"
          style="background:rgba(139,143,158,.1);color:var(--text2);border:1px solid var(--border);
          border-radius:6px;padding:5px 14px;font-size:11px;cursor:pointer;font-weight:500;">忽略</button>
        ` : ''}
        ${isReplied ? `<span style="font-size:10px;color:var(--green);">✅ 已处理</span>` : ''}
        ${isIgnored ? `<span style="font-size:10px;color:var(--text2);">⏭️ 已忽略</span>` : ''}
      </div>
    </div>`;
}

// Delegate click events for work action buttons
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.work-action-btn');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'reply') handleWorkReply(id);
  else if (action === 'ignore') handleWorkIgnore(id);
});

async function handleWorkReply(msgId) {
  if (!msgId) return;
  // Show reply modal with AI suggestion editable
  const card = document.querySelector(`.work-message-card[data-id="${msgId}"]`);
  const suggestionEl = card?.querySelector('div[style*="background:var(--surface2)"] div:last-child');
  const defaultSuggestion = suggestionEl ? suggestionEl.textContent : '';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:var(--surface2,#1a1d27);border:1px solid var(--border,#252a36);border-radius:12px;padding:20px;width:90%;max-width:500px;display:flex;flex-direction:column;color:var(--text,#e4e6ef);';

  modal.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <strong style="font-size:14px;">💬 回复消息</strong>
      <span style="font-size:11px;color:var(--text2,#8b8f9e);">ID: ${msgId}</span>
    </div>
    <textarea id="reply-content"
      style="min-height:150px;background:var(--bg,#0a0b0f);color:var(--accent2,#a29bfe);border:1px solid var(--border,#252a36);
      border-radius:6px;padding:14px;font-family:inherit;font-size:13px;line-height:1.6;resize:vertical;"
      placeholder="输入回复内容...">${defaultSuggestion}</textarea>
    <div id="reply-status" style="font-size:11px;color:var(--text2,#8b8f9e);margin-top:8px;min-height:18px;"></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button id="reply-cancel"
        style="background:var(--surface,#12141a);color:var(--text,#e4e6ef);border:1px solid var(--border,#252a36);padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">取消</button>
      <button id="reply-send"
        style="background:var(--green,#00b894);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">📤 发送回复</button>
    </div>`;

  overlay.appendChild(modal);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);

  document.getElementById('reply-cancel').onclick = () => overlay.remove();
  document.getElementById('reply-send').onclick = async () => {
    const content = document.getElementById('reply-content').value.trim();
    if (!content) { showToast('⚠️ 请输入回复内容'); return; }
    const status = document.getElementById('reply-status');
    status.textContent = '⏳ 发送中...';
    try {
      const res = await fetch(`/api/feishu/messages/${msgId}/reply`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ content: content })
      });
      if (res.ok) {
        status.textContent = '✅ 回复已发送！';
        status.style.color = 'var(--green)';
        setTimeout(() => overlay.remove(), 1000);
        showToast('✅ 回复发送成功');
        loadWorkMessages();
        loadWorkStats();
      } else {
        const err = await res.json().catch(() => ({error: '未知错误'}));
        status.textContent = '❌ 发送失败: ' + (err.error || err.detail || res.statusText);
        status.style.color = 'var(--red)';
      }
    } catch (e) {
      status.textContent = '❌ 发送失败: ' + e.message;
      status.style.color = 'var(--red)';
    }
  };
}

async function handleWorkIgnore(msgId) {
  if (!msgId) return;
  if (!confirm('确定忽略该消息？')) return;
  try {
    const res = await fetch(`/api/feishu/messages/${msgId}/ignore`, {
      method: 'POST'
    });
    if (res.ok) {
      showToast('✅ 已忽略');
      loadWorkMessages();
      loadWorkStats();
    } else {
      const err = await res.json().catch(() => ({error: '未知错误'}));
      showToast('❌ 忽略失败: ' + (err.error || err.detail || res.statusText));
    }
  } catch (e) {
    showToast('❌ 忽略失败: ' + e.message);
  }
}

// ─── Toast Notification ────────────────────────────────────────

function showToast(msg) {
  const existing = document.getElementById('assistant-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'assistant-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:var(--surface2);border:1px solid var(--border);
    color:var(--text);padding:10px 20px;border-radius:8px;
    font-size:12px;z-index:10001;box-shadow:0 4px 20px rgba(0,0,0,.4);
    animation: toastIn .25s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity .3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Inject toast keyframe if not exists
if (!document.getElementById('toast-style')) {
  const style = document.createElement('style');
  style.id = 'toast-style';
  style.textContent = `
    @keyframes toastIn {
      from { opacity:0; transform:translateX(-50%) translateY(10px); }
      to { opacity:1; transform:translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
