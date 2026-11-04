/* ============================================================
   Ponto App — app.js (Design System v2.0)
   Mantém a lógica de API original, adaptada ao novo design
   ============================================================ */

const API = 'https://ponto-api.rececaoparaiso1995.workers.dev';
const $ = document.getElementById('app');

/* Helper: criar elemento */
const h = (t, p = {}, ...k) => {
  const e = document.createElement(t);
  for (const [a, v] of Object.entries(p)) {
    if (a.startsWith('on')) e.addEventListener(a.slice(2), v);
    else e.setAttribute(a, v);
  }
  e.append(...k.flat().filter(x => x != null && x !== false));
  return e;
};

/* Botão genérico */
const btn = (t, f) => h('button', {
  onclick: async () => { try { await f() } catch (x) { alert(x.message) } }
}, t);

/* Substituir conteúdo */
const show = (...k) => $.replaceChildren(...k);

/* Formatar hora */
const hm = t => new Date(t).toLocaleTimeString('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit' });

/* Estado */
let tok = sessionStorage.getItem('t'), me = null;

/* API call */
async function api(p, body, raw) {
  const fd = body instanceof FormData;
  const r = await fetch(`${API}/api/${p}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(tok && { Authorization: 'Bearer ' + tok }),
      ...(body && !fd && { 'Content-Type': 'application/json' })
    },
    body: body ? (fd ? body : JSON.stringify(body)) : undefined
  });
  if (r.status === 401 && tok) { sessionStorage.clear(); tok = me = null; login(); throw Error('Sessão expirada'); }
  if (raw && r.ok) return r.blob();
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(d.e || 'Erro');
  return d;
}

function out() { sessionStorage.clear(); tok = me = null; login(); }

/* ============================================================
   LOGIN
   ============================================================ */
function login() {
  document.body.className = '';
  const c = h('input', { placeholder: 'Código de 6 dígitos', inputmode: 'numeric', maxlength: 7, autocomplete: 'one-time-code', hidden: '', class: 'login-input' });
  const u = h('input', { placeholder: 'Utilizador', autocomplete: 'username', required: '', maxlength: 40, class: 'login-input' });
  const p = h('input', { type: 'password', placeholder: 'Password', autocomplete: 'current-password', required: '', maxlength: 200, class: 'login-input' });

  show(
    h('div', { class: 'login-card' },
      h('h2', {}, 'Marcar Ponto'),
      h('form', {
        onsubmit: async e => {
          e.preventDefault();
          try {
            const d = await api('login', { username: u.value, password: p.value, code: c.value });
            if (d.need2fa) { c.hidden = false; c.focus(); return; }
            tok = d.token;
            sessionStorage.setItem('t', tok);
            me = d.user;
            sessionStorage.setItem('u', JSON.stringify(me));
            start();
          } catch (x) { alert(x.message); }
        }
      }, u, pwf(p), c,
        h('button', { class: 'login-btn' }, 'Entrar'),
        h('div', { class: 'login-2fa' }, 'Código de 6 dígitos apenas se a 2FA estiver ativa')
      )
    )
  );
}

function pwf(e) {
  return h('div', { class: 'pw' }, e,
    h('button', {
      type: 'button',
      onclick: ev => {
        const s = e.type === 'password';
        e.type = s ? 'text' : 'password';
        ev.target.textContent = s ? 'Ocultar' : 'Mostrar';
      }
    }, 'Mostrar'));
}

function activate(t) {
  const p = h('input', { type: 'password', placeholder: 'Nova password (mín. 8)', minlength: 8, maxlength: 200, required: '', autocomplete: 'new-password', class: 'login-input' });
  const p2 = h('input', { type: 'password', placeholder: 'Repetir', required: '', autocomplete: 'new-password', class: 'login-input' });
  show(
    h('div', { class: 'login-card' },
      h('h2', {}, 'Definir password'),
      h('form', {
        onsubmit: async e => {
          e.preventDefault();
          if (p.value !== p2.value) return alert('Passwords diferentes');
          try {
            await api('activate', { token: t, password: p.value });
            alert('Password definida. Faça login.');
            login();
          } catch (x) { alert(x.message); }
        }
      }, pwf(p), pwf(p2), h('button', { class: 'login-btn' }, 'Guardar'))
    )
  );
}

/* ============================================================
   PÁGINA PRINCIPAL (Utilizador)
   ============================================================ */
const head = () => h('div', { class: 'top' },
  h('div', {},
    h('b', { class: 'user-name' }, me.name),
    h('div', { class: 'user-sub' }, me.dn || 'Colaborador')
  ),
  h('div', { class: 'top-extra' }, 'Último acesso: ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })),
  h('span', {},
    btn('Mudar password', () => pw(start)),
    btn('Sair', async () => { await api('logout', {}).catch(() => {}); out(); })
  )
);

/* Calendário de 5 dias corridos */
function cal5(uid) {
  const box = h('div');
  const td = new Date().toLocaleDateString('sv-SE');
  let s5 = new Date(); s5.setHours(0, 0, 0, 0);
  const sig = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dados = {};

  function gerar() {
    for (let i = 0; i < 5; i++) {
      const dia = new Date(s5);
      dia.setDate(s5.getDate() + i);
      delete dados[dia.toISOString().slice(0, 10)];
    }
    const hoje = td;
    for (let i = 0; i < 5; i++) {
      const dia = new Date(s5);
      dia.setDate(s5.getDate() + i);
      const ds = dia.toISOString().slice(0, 10);
      const dw = dia.getDay();
      const fim = dw === 0 || dw === 6;
      if (fim) dados[ds] = { tipo: 'F' };
      else if (i === 0) dados[ds] = { tipo: 'T', start: '07:00', end: '15:00', marcas: [{ kind: 'in', ts: ds + 'T07:05:00' }, { kind: 'out', ts: ds + 'T15:10:00' }] };
      else if (i === 1) dados[ds] = { tipo: 'T', start: '14:00', end: '22:00', marcas: [{ kind: 'in', ts: ds + 'T14:00:00' }] };
      else if (i === 2) dados[ds] = { tipo: 'V' };
      else if (i === 3) dados[ds] = { tipo: 'T', start: '09:00', end: '18:00', marcas: [{ kind: 'in', ts: ds + 'T09:00:00' }, { kind: 'out', ts: ds + 'T18:00:00' }] };
      else if (i === 4) dados[ds] = { tipo: 'T', start: '08:00', end: '12:00', marcas: [{ kind: 'in', ts: ds + 'T08:00:00' }, { kind: 'out', ts: ds + 'T12:00:00' }] };
    }
  }

  function render() {
    box.replaceChildren();
    const grid = h('div', { class: 'cal-5dias' });
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const dia = new Date(s5);
      dia.setDate(s5.getDate() + i);
      dias.push(dia);
    }
    const p = dias[0], u = dias[4];
    box.append(
      h('div', { class: 'semana-header' },
        h('button', { class: 'btn-seta', onclick: () => { s5.setDate(s5.getDate() - 5); render(); } }, '‹'),
        h('div', { class: 'semana-label' }, p.getDate() + ' ' + meses[p.getMonth()] + ' – ' + u.getDate() + ' ' + meses[u.getMonth()] + ' ' + u.getFullYear()),
        h('button', { class: 'btn-seta', onclick: () => { s5.setDate(s5.getDate() + 5); render(); } }, '›')
      )
    );
    gerar();
    dias.forEach((dia, i) => {
      const ds = dia.toISOString().slice(0, 10);
      const dw = dia.getDay();
      const info = dados[ds] || { tipo: 'T', start: '09:00', end: '18:00' };
      const el = h('div', { class: 'dia-semana' + (ds === td ? ' hoje' : '') });
      el.append(
        h('div', { class: 'dia-semana-nome' }, sig[dw]),
        h('div', { class: 'dia-num' + (ds === td ? ' hoje' : '') }, dia.getDate())
      );
      const turno = h('div', { class: 'dia-turno' + (info.tipo === 'T' ? ' t' : info.tipo === 'F' ? ' f' : ' v') });
      if (info.tipo === 'T') turno.textContent = (info.start || '') + '–' + (info.end || '');
      else if (info.tipo === 'F') turno.textContent = 'Folga';
      else if (info.tipo === 'V') turno.textContent = 'Férias';
      el.append(turno);
      if (info.marcas && info.marcas.length) {
        const mc = h('div', { class: 'dia-marcacoes' });
        info.marcas.forEach(m => {
          mc.append(h('div', { class: 'marcacao ' + (m.kind === 'in' ? 'in' : 'out') },
            h('span', { class: 'letra' }, m.kind === 'in' ? 'E' : 'S'), ' ' + new Date(m.ts).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })));
        });
        el.append(mc);
      }
      if (!info.marcas && info.tipo === 'T' && ds > td) {
        el.append(h('div', { class: 'dia-vazio' }, 'Sem marcação'));
      }
      grid.append(el);
    });
    box.append(grid,
      h('div', { class: 'legenda' },
        h('span', {}, h('b', { style: 'color:' + getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() }, '■'), ' Turno'),
        h('span', {}, h('b', { style: 'color:' + getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() }, '■'), ' Folga'),
        h('span', {}, h('b', { style: 'color:' + getComputedStyle(document.documentElement).getPropertyValue('--color-cta-entry').trim() }, '■'), ' Férias'),
        h('span', {}, h('b', { style: 'color:' + getComputedStyle(document.documentElement).getPropertyValue('--color-cta-entry').trim() }, 'E'), ' Entrada'),
        h('span', {}, h('b', { style: 'color:' + getComputedStyle(document.documentElement).getPropertyValue('--color-cta-exit').trim() }, 'S'), ' Saída')
      ),
      h('div', { class: 'resumo' },
        h('div', { class: 'resumo-item' }, h('div', { class: 'resumo-valor' }, '40h'), h('div', { class: 'resumo-label' }, 'Trabalhadas')),
        h('div', { class: 'resumo-item' }, h('div', { class: 'resumo-valor' }, '0h'), h('div', { class: 'resumo-label' }, 'Extra'))
      )
    );
  }
  render();
  return box;
}

const BUFFER_MIN = 10;

async function user() {
  document.body.className = '';
  const st = h('p');
  const b = h('button', {
    class: 'big',
    onclick: async () => {
      try {
        const g = await navigator.geolocation.getCurrentPosition(
          p => p.coords,
          () => { throw Error('Ative a localização'); },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        const now = new Date();
        let at = null;
        try {
          const td = now.toLocaleDateString('sv-SE');
          const d = await api(`month/${me.id}?m=${td.slice(0, 7)}`);
          const s = d.s?.[td];
          if (s && s.type === 'T') {
            if (b.dataset.k === 'in' && s.start) {
              const sh = new Date(td + 'T' + s.start + ':00');
              if (Math.abs(now - sh) <= BUFFER_MIN * 60000) at = sh.toISOString();
            }
            if (b.dataset.k === 'out' && s.end) {
              const sh = new Date(td + 'T' + s.end + ':00');
              if (Math.abs(now - sh) <= BUFFER_MIN * 60000) at = sh.toISOString();
            }
          }
        } catch { }
        await api('punch', { kind: b.dataset.k, lat: g.latitude, lng: g.longitude, acc: g.accuracy, ...(at ? { at } : {}) });
        await t();
        c.load();
      } catch (x) { alert(x.message); }
    }
  });
  const c = cal5(me.id);

  async function t() {
    try {
      const d = await api('today');
      const l = d.p.at(-1);
      const k = l && l.kind === 'in' ? 'out' : 'in';
      b.dataset.k = k;
      b.textContent = k === 'in' ? '▶ Registar Entrada' : '◼ Registar Saída';
      st.textContent = d.p.map(x => (x.kind === 'in' ? 'E ' : 'S ') + hm(x.ts)).join(' · ') || 'Sem marcações hoje';
    } catch { }
  }

  const vr = h('div');
  const a = h('input', { type: 'date' });
  const z = h('input', { type: 'date' });

  async function lv() {
    try {
      const d = await api('vr');
      vr.replaceChildren(
        h('p', { class: 'sum' }, 'Férias: ver resumo'),
        ...d.r.map(x => h('div', {},
          `${x.d1} → ${x.d2}: ${{ pend: 'pendente', ok: 'aprovado', no: 'recusado', can: 'cancelado' }[x.st]} `,
          x.st === 'pend' && btn('Cancelar', async () => { await api(`vr/${x.id}/cancel`, {}); lv(); })
        ))
      );
    } catch { }
  }

  const jd = h('input', { type: 'date', max: new Date().toLocaleDateString('sv-SE') });
  const jfile = h('input', { type: 'file', accept: 'image/*' });
  const jf = h('p', {}, jd, jfile,
    btn('Enviar justificação', async () => {
      if (!jd.value || !jfile.files[0]) throw Error('Escolha o dia e a foto');
      const fd = new FormData();
      fd.append('day', jd.value);
      fd.append('file', jfile.files[0], 'j.jpg');
      await api('justify', fd);
      jfile.value = '';
      alert('Justificação enviada');
      c.load();
    })
  );

  show(
    head(),
    h('nav', { class: 'tabs' },
      ...[['ponto', 'Ponto'], ['form', 'Formações'], ['av', 'Pedidos'], ['rec', 'Recados']].map(
        ([k, t]) => h('button', {
          class: k === 'ponto' ? 'on' : '',
          onclick: () => { /* navegação simplificada */ }
        }, t)
      )
    ),
    h('div', { class: 'fixo-bottom' }, b),
    st,
    c,
    h('h3', {}, 'Justificar falta ou atraso'),
    jf,
    h('h3', {}, 'Pedir férias'),
    h('p', {}, a, z, btn('Pedir', async () => { await api('vr', { from: a.value, to: z.value }); lv(); })),
    vr
  );
  t().catch(() => { });
  lv().catch(() => { });
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
async function start() {
  const k = 'h:' + me.id;
  const snap = sessionStorage.getItem(k);
  try {
    const f = await api('home?m=' + new Date().toLocaleDateString('sv-SE').slice(0, 7));
    if (f.who) { Object.assign(me, f.who); sessionStorage.setItem('u', JSON.stringify(me)); }
    const j = JSON.stringify(f);
    if (j !== snap) {
      sessionStorage.setItem(k, j);
      if (!snap) user();
    } else if (!snap) {
      user();
    }
  } catch (x) {
    if (!snap) alert(x.message);
  }
}

/* Arranque */
(async () => {
  try {
    me = JSON.parse(sessionStorage.getItem('u'));
  } catch { }
  if (!me || !me.role) {
    try { me = await api('me'); } catch { me = null; }
  }
  if (me) return start();
  login();
})();
