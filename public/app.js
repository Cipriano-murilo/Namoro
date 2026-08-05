// ============================================
// app.js — Lógica do Site de Namoro 💕
// ============================================

const API_BASE = 'api'; // Caminho relativo para os endpoints PHP

// ── Estado global ──
const state = {
  usuario: null,
  fotos: [],
  sentimentos: [],
  emojiSelecionado: '💕',
  arquivoSelecionado: null,
  timerInterval: null,
  pollingInterval: null,
};

// ── Data de início do namoro ──
const INICIO_NAMORO = new Date('2025-03-08T00:00:00');

// ============================================
// UTILITÁRIOS
// ============================================

/** Mostra uma notificação toast */
function showToast(msg, tipo = 'success') {
  const el = document.getElementById('toast');
  el.textContent = (tipo === 'success' ? '✅ ' : '❌ ') + msg;
  el.className = `toast ${tipo} show`;
  setTimeout(() => { el.className = 'toast'; }, 3500);
}

/** Chamada à API */
async function api(endpoint, opts = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const token = localStorage.getItem('namoro_token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(data.error || 'Erro desconhecido');
  return data;
}

/** Formata data legível */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Pega inicial do nome */
function getInicial(nome) {
  return (nome || '?').charAt(0).toUpperCase();
}

// ============================================
// PARTÍCULAS DE CORAÇÃO
// ============================================
function criarParticulas() {
  const container = document.getElementById('hearts-container');
  const emojis = ['💕', '❤️', '💗', '💖', '🌸', '✨'];
  let count = 0;

  setInterval(() => {
    if (count >= 12) return; // Máximo de partículas
    count++;
    const el = document.createElement('div');
    el.className = 'heart-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${0.8 + Math.random() * 1.2}rem`;
    const dur = 8 + Math.random() * 6;
    el.style.animationDuration = `${dur}s`;
    el.style.animationDelay = '0s';
    container.appendChild(el);

    setTimeout(() => {
      el.remove();
      count--;
    }, dur * 1000);
  }, 1800);
}

// ============================================
// CRONÔMETRO
// ============================================
function calcularTempo() {
  const agora   = new Date();
  const diff    = agora - INICIO_NAMORO; // ms

  const totalSeg  = Math.floor(diff / 1000);
  const totalMin  = Math.floor(totalSeg / 60);
  const totalHoras= Math.floor(totalMin / 60);
  const totalDias = Math.floor(totalHoras / 24);

  // Calcular anos, meses e dias exatos
  const inicio = INICIO_NAMORO;
  let anos = agora.getFullYear() - inicio.getFullYear();
  let meses = agora.getMonth() - inicio.getMonth();
  let dias = agora.getDate() - inicio.getDate();

  if (dias < 0) {
    meses--;
    // Pega o último dia do mês anterior para emprestar os dias
    const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }

  if (meses < 0) {
    anos--;
    meses += 12;
  }

  const diasRestantes = dias;

  const horas   = agora.getHours();
  const minutos = agora.getMinutes();
  const segs    = agora.getSeconds();

  function pad(n) { return String(n).padStart(2, '0'); }

  document.getElementById('t-anos').textContent  = pad(anos);
  document.getElementById('t-meses').textContent = pad(meses);
  document.getElementById('t-dias').textContent  = pad(diasRestantes);
  document.getElementById('t-horas').textContent = pad(horas);
  document.getElementById('t-min').textContent   = pad(minutos);
  document.getElementById('t-seg').textContent   = pad(segs);

  // Texto total
  const totalEl = document.getElementById('total-text');
  totalEl.innerHTML = `Total: <strong>${totalDias.toLocaleString('pt-BR')} dias</strong> · <strong>${totalHoras.toLocaleString('pt-BR')} horas</strong> · <strong>${totalMin.toLocaleString('pt-BR')} minutos</strong>`;
}

function iniciarCronometro() {
  calcularTempo();
  state.timerInterval = setInterval(calcularTempo, 1000);
}

// ============================================
// LOGIN
// ============================================
function initLogin() {
  const form = document.getElementById('login-form');
  const btn  = document.getElementById('btn-login');
  const err  = document.getElementById('login-error');
  const toggleSenha = document.getElementById('btn-toggle-senha');
  const inputSenha = document.getElementById('login-senha');

  toggleSenha.addEventListener('click', () => {
    const isPassword = inputSenha.type === 'password';
    inputSenha.type = isPassword ? 'text' : 'password';
    toggleSenha.textContent = isPassword ? '🙈' : '👁️';
    toggleSenha.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const senha    = document.getElementById('login-senha').value;

    if (!username || !senha) {
      mostrarErro('Por favor, preencha usuário e senha.');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';
    err.classList.remove('show');

    try {
      const data = await api('login', {
        method: 'POST',
        body: JSON.stringify({ username, senha }),
      });

      localStorage.setItem('namoro_token', data.token);
      state.usuario = data.usuario;
      entrarNoDashboard();
    } catch (ex) {
      mostrarErro(ex.message || 'Erro ao fazer login. Tente novamente.');
      btn.disabled = false;
      btn.textContent = 'Entrar ✨';
    }
  });

  function mostrarErro(msg) {
    err.textContent = msg;
    err.classList.add('show');
  }
}

// ============================================
// VERIFICAR SESSÃO EXISTENTE
// ============================================
async function verificarSessao() {
  try {
    const data = await api('me');
    state.usuario = data.usuario;
    entrarNoDashboard();
  } catch {
    // Não está logado — mostrar tela de login normalmente
    document.getElementById('screen-login').style.display = 'flex';
  }
}

// ============================================
// ENTRAR NO DASHBOARD
// ============================================
function entrarNoDashboard() {
  // Esconder login, mostrar dashboard
  document.getElementById('screen-login').style.display = 'none';
  const dash = document.getElementById('screen-dashboard');
  dash.style.display = 'block';
  dash.classList.add('active');

  // Atualizar header
  const u = state.usuario;
  document.getElementById('user-nome').textContent = u.nome;
  document.getElementById('user-avatar').textContent = getInicial(u.nome);

  // Iniciar funcionalidades
  iniciarCronometro();
  carregarFotos();
  carregarSentimentos();
  iniciarPolling();
  criarParticulas();

  // Logout
  document.getElementById('btn-logout').addEventListener('click', logout);
}

async function logout() {
  try { await api('logout'); } catch {}
  localStorage.removeItem('namoro_token');
  state.usuario = null;
  clearInterval(state.timerInterval);
  clearInterval(state.pollingInterval);
  state.pollingInterval = null;

  document.getElementById('screen-dashboard').style.display = 'none';
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-login').style.display = 'flex';
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.remove('show');
}

// ============================================
// ABAS DE NAVEGAÇÃO
// ============================================
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ============================================
// GALERIA DE FOTOS
// ============================================
function initFotos() {
  const zone    = document.getElementById('upload-zone');
  const input   = document.getElementById('foto-input');
  const descRow = document.getElementById('upload-desc-row');
  const btnEnv  = document.getElementById('btn-enviar-foto');
  const btnCanc = document.getElementById('btn-cancelar-foto');

  // Clique na zona → abre seletor de arquivo
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') input.click(); });

  // Drag & drop
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length) selecionarArquivo(files[0]);
  });

  // Seleção via input
  input.addEventListener('change', () => {
    if (input.files.length) selecionarArquivo(input.files[0]);
  });

  function selecionarArquivo(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Apenas imagens são permitidas', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo muito grande (máximo 10 MB)', 'error');
      return;
    }
    state.arquivoSelecionado = file;
    descRow.classList.add('show');
    document.getElementById('foto-desc').focus();
  }

  // Enviar foto
  btnEnv.addEventListener('click', async () => {
    if (!state.arquivoSelecionado) return;

    const desc = document.getElementById('foto-desc').value.trim();
    const fd   = new FormData();
    fd.append('foto', state.arquivoSelecionado);
    fd.append('descricao', desc);

    btnEnv.disabled = true;
    btnEnv.textContent = 'Enviando...';
    document.getElementById('upload-progress').style.display = 'block';
    document.getElementById('progress-fill').style.width = '60%';

    const token = localStorage.getItem('namoro_token');
    if (token) fd.append('token', token); // caso queira enviar via POST, mas enviaremos no header

    try {
      const data = await fetch(`${API_BASE}/fotos`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: fd,
      }).then(r => r.json());

      if (!data.ok) throw new Error(data.error);

      document.getElementById('progress-fill').style.width = '100%';
      setTimeout(() => {
        document.getElementById('upload-progress').style.display = 'none';
        document.getElementById('progress-fill').style.width = '0%';
      }, 600);

      state.fotos.unshift(data.foto);
      renderFotos();
      cancelarUpload();
      showToast('Foto adicionada! 📸');
    } catch (ex) {
      showToast(ex.message || 'Erro ao enviar foto', 'error');
      document.getElementById('upload-progress').style.display = 'none';
    } finally {
      btnEnv.disabled = false;
      btnEnv.textContent = '📤 Enviar';
    }
  });

  // Cancelar
  btnCanc.addEventListener('click', cancelarUpload);

  function cancelarUpload() {
    state.arquivoSelecionado = null;
    input.value = '';
    descRow.classList.remove('show');
    document.getElementById('foto-desc').value = '';
  }

  // Lightbox
  document.getElementById('lightbox-close').addEventListener('click', fecharLightbox);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) fecharLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharLightbox();
  });
}

function abrirLightbox(url, alt) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox-img').alt = alt || 'Foto';
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
}

function fecharLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.getElementById('lightbox-img').src = '';
}

async function carregarFotos() {
  try {
    const data = await api('fotos');
    state.fotos = data.fotos;
    renderFotos();
  } catch (ex) {
    document.getElementById('photos-grid').innerHTML =
      `<div class="photos-empty"><div class="empty-icon">⚠️</div><p>Erro ao carregar fotos: ${ex.message}</p></div>`;
  }
}

function renderFotos() {
  const grid = document.getElementById('photos-grid');
  if (!state.fotos.length) {
    grid.innerHTML = `
      <div class="photos-empty">
        <div class="empty-icon">🌸</div>
        <p>Nenhuma foto ainda...<br/>Adicione o primeiro momento especial!</p>
      </div>`;
    return;
  }

  grid.innerHTML = state.fotos.map(foto => `
    <div class="photo-card" data-id="${foto.id}">
      <img src="${escapeHtml(foto.url)}" alt="${escapeHtml(foto.descricao || foto.nome_original)}" loading="lazy"
           onclick="abrirLightbox('${escapeHtml(foto.url)}', '${escapeHtml(foto.descricao || foto.nome_original)}')" />
      <button class="btn-delete-photo" onclick="deletarFoto(${foto.id})" aria-label="Remover foto" title="Remover">🗑️</button>
      <div class="photo-card-overlay">
        ${foto.descricao ? `<p class="photo-card-desc">${escapeHtml(foto.descricao)}</p>` : ''}
        <p class="photo-card-meta">📸 ${escapeHtml(foto.enviado_por)} · ${formatarDataSimples(foto.criado_em)}</p>
      </div>
    </div>
  `).join('');
}

async function deletarFoto(id) {
  if (!confirm('Remover esta foto?')) return;
  try {
    await api(`fotos?id=${id}`, { method: 'DELETE', headers: {} });
    state.fotos = state.fotos.filter(f => f.id !== id);
    renderFotos();
    showToast('Foto removida');
  } catch (ex) {
    showToast(ex.message || 'Erro ao remover foto', 'error');
  }
}

// ============================================
// SENTIMENTOS
// ============================================
function initSentimentos() {
  // Seletor de emoji
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.emojiSelecionado = btn.dataset.emoji;
    });
  });

  // Contador de caracteres
  const ta = document.getElementById('feeling-text');
  ta.addEventListener('input', () => {
    document.getElementById('char-count').textContent = ta.value.length;
  });

  // Enviar sentimento
  document.getElementById('btn-send-feeling').addEventListener('click', enviarSentimento);
  ta.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') enviarSentimento();
  });
}

async function enviarSentimento() {
  const ta  = document.getElementById('feeling-text');
  const btn = document.getElementById('btn-send-feeling');
  const msg = ta.value.trim();

  if (!msg) { showToast('Escreva algo antes de enviar 💕', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const data = await api('sentimentos', {
      method: 'POST',
      body: JSON.stringify({ mensagem: msg, emoji: state.emojiSelecionado }),
    });

    state.sentimentos.unshift(data.sentimento);
    renderSentimentos();
    ta.value = '';
    document.getElementById('char-count').textContent = '0';
    showToast('Sentimento enviado! 💌');
  } catch (ex) {
    showToast(ex.message || 'Erro ao enviar mensagem', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>Enviar 💌</span>';
  }
}

async function carregarSentimentos() {
  try {
    const data = await api('sentimentos?limit=50');
    state.sentimentos = data.sentimentos;
    renderSentimentos();
  } catch (ex) {
    document.getElementById('feelings-feed').innerHTML =
      `<div class="feelings-empty"><p>Erro ao carregar: ${ex.message}</p></div>`;
  }
}

// Atualiza mensagens automaticamente a cada 5 segundos
function iniciarPolling() {
  if (state.pollingInterval) clearInterval(state.pollingInterval);
  state.pollingInterval = setInterval(async () => {
    try {
      const data = await api('sentimentos?limit=50');
      // Só re-renderiza se houver mudança (evita piscar a tela)
      const idsNovos = data.sentimentos.map(s => s.id).join();
      const idsAtuais = state.sentimentos.map(s => s.id).join();
      if (idsNovos !== idsAtuais) {
        state.sentimentos = data.sentimentos;
        renderSentimentos();
      }
    } catch { /* silencioso */ }
  }, 5000);
}

function renderSentimentos() {
  const feed = document.getElementById('feelings-feed');
  if (!state.sentimentos.length) {
    feed.innerHTML = `
      <div class="feelings-empty">
        <div style="font-size:2rem;margin-bottom:8px">💭</div>
        <p>Nenhuma mensagem ainda...<br/>Diga o que está sentindo!</p>
      </div>`;
    return;
  }

  const meuUsername = state.usuario?.username;

  feed.innerHTML = state.sentimentos.map(s => `
    <div class="feeling-bubble ${s.username === meuUsername ? 'mine' : ''}" data-id="${s.id}">
      <button class="btn-delete-feeling" onclick="deletarSentimento(${s.id})" aria-label="Remover mensagem" title="Remover">🗑️</button>
      <div class="feeling-header">
        <div class="feeling-avatar">${getInicial(s.autor)}</div>
        <span class="feeling-author">${escapeHtml(s.autor)}</span>
        <span class="feeling-time">${formatarDataSimples(s.criado_em)}</span>
      </div>
      <p class="feeling-text">
        <span class="feeling-emoji">${s.emoji}</span>${escapeHtml(s.mensagem)}
      </p>
    </div>
  `).join('');
}

async function deletarSentimento(id) {
  if (!confirm('Remover esta mensagem?')) return;
  try {
    await api(`sentimentos?id=${id}`, { method: 'DELETE', headers: {} });
    state.sentimentos = state.sentimentos.filter(s => s.id !== id);
    renderSentimentos();
    showToast('Mensagem removida');
  } catch (ex) {
    showToast(ex.message || 'Erro ao remover', 'error');
  }
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatarDataSimples(iso) {
  if (!iso) return '';
  // Garante que a string seja tratada como UTC (adiciona 'Z' se necessário)
  const isoUtc = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
  const d = new Date(isoUtc);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Sao_Paulo' }) +
         ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initTabs();
  initFotos();
  initSentimentos();
  verificarSessao();
});
