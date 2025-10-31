(function () {
  const statusEl = document.getElementById('status');
  const yearSelect = document.getElementById('yearSelect');
  const loadBtn = document.getElementById('loadBtn');
  const content = document.getElementById('content');
  const tpl = document.getElementById('question-template');

  // Known CSVs found in the workspace root of this app (parent directory)
  // Add more years if you generate more CSVs.
  const yearToCsv = {
    1996: '../csv migrated/GATE_CS_1996.csv',
    1997: '../csv migrated/GATE_CS_1997.csv',
    1998: '../csv migrated/GATE_CS_1998.csv',
    1999: '../csv migrated/GATE_CS_1999.csv',
    2000: '../csv migrated/GATE_CS_2000.csv',
    2001: '../csv migrated/GATE_CS_2001.csv',
    2002: '../csv migrated/GATE_CS_2002.csv',
    2003: '../csv migrated/GATE_CS_2003.csv',
    2004: '../csv migrated/GATE_CS_2004.csv',
    2005: '../csv migrated/GATE_CS_2005.csv',
    2006: '../csv migrated/GATE_CS_2006.csv',
    2007: '../csv migrated/GATE_CS_2007.csv',
    2008: '../csv migrated/GATE_CS_2008.csv',
    2009: '../csv migrated/GATE_CS_2009.csv',
    2010: '../csv migrated/GATE_CS_2010.csv',
    2011: '../csv migrated/GATE_CS_2011.csv',
    2012: '../csv migrated/GATE_CS_2012.csv',
    2013: '../csv migrated/GATE_CS_2013.csv',
    2014: '../csv migrated/GATE_CS_2014.csv',
    2015: '../csv migrated/GATE_CS_2015.csv',
    2016: '../csv migrated/GATE_CS_2016.csv',
    2017: '../csv migrated/GATE_CS_2017.csv',
    2018: '../csv migrated/GATE_CS_2018.csv',
    2019: '../csv migrated/GATE_CS_2019.csv',
    2020: '../csv migrated/GATE_CS_2020.csv',
    2021: '../csv migrated/GATE_CS_2021.csv',
    2022: '../csv migrated/GATE_CS_2022.csv',
    2023: '../csv migrated/GATE_CS_2023.csv',
    2024: '../csv migrated/GATE_CS_2024.csv',
    2025: '../csv migrated/GATE_CS_2025.csv',
  };

  // Optional fallback location when CSVs are saved into GATE_Papers_CSV
  function fallbackPath(year) {
    return `../GATE_Papers_CSV/GATE_CS_${year}.csv`;
  }

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  function splitUrls(s) {
    if (!s) return [];
    return s
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderImages(container, urls) {
    urls.forEach((src) => {
      const img = new Image();
      img.loading = 'lazy';
      img.src = src;
      img.alt = 'image';
      container.appendChild(img);
    });
  }

  function renderQuestion(row) {
    const node = tpl.content.cloneNode(true);
    const num = node.querySelector('.q-num');
    const type = node.querySelector('.q-type');
    const subject = node.querySelector('.subject');
    const chapter = node.querySelector('.chapter');
    const subtopic = node.querySelector('.subtopic');
    const qText = node.querySelector('.q-text');
    const qImgs = node.querySelector('.q-images');
    const opts = node.querySelector('.options');
    const toggleBtn = node.querySelector('.toggle-exp');
    const expBody = node.querySelector('.exp-body');
    const expText = node.querySelector('.exp-text');
    const expImgs = node.querySelector('.exp-images');

    num.textContent = `Q${row.Question_Number ?? ''}`;
    type.textContent = row.Question_Type ? `(${row.Question_Type})` : '';
    subject.textContent = row.subject || 'Not classified';
    chapter.textContent = row.chapter || 'Not classified';
    subtopic.textContent = row.subtopic || 'Not classified';
    qText.textContent = row.Question_Text || '';
    renderImages(qImgs, splitUrls(row.Question_Images));

    const correct = (row.Correct_Answer || '').toString().trim().toUpperCase();

    const optionDefs = [
      { key: 'A', text: row.Option_A, imgs: row.Option_A_Images },
      { key: 'B', text: row.Option_B, imgs: row.Option_B_Images },
      { key: 'C', text: row.Option_C, imgs: row.Option_C_Images },
      { key: 'D', text: row.Option_D, imgs: row.Option_D_Images },
    ];

    optionDefs.forEach((opt) => {
      if (!opt.text && !opt.imgs) return;
      const li = el('li', 'option' + (opt.key === correct ? ' correct' : ''));
      const label = el('div', 'label', opt.key);
      const body = el('div', 'text');
      const t = el('div', null, opt.text || '');
      const imgs = el('div', 'imgs');
      body.appendChild(t);
      const urls = splitUrls(opt.imgs);
      if (urls.length) renderImages(imgs, urls);
      li.appendChild(label);
      li.appendChild(body);
      if (opt.key === correct) {
        const badge = el('div', 'badge', 'Correct');
        li.appendChild(badge);
      }
      if (urls.length) li.appendChild(imgs);
      opts.appendChild(li);
    });

    // Explanation
    const hasExp = (row.Explanation && row.Explanation.trim()) || (row.Explanation_Images && row.Explanation_Images.trim());
    if (hasExp) {
      expText.textContent = row.Explanation || '';
      renderImages(expImgs, splitUrls(row.Explanation_Images));
      toggleBtn.addEventListener('click', () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!expanded));
        toggleBtn.textContent = expanded ? 'Show explanation' : 'Hide explanation';
        expBody.hidden = expanded;
      });
    } else {
      // No explanation available
      toggleBtn.disabled = true;
      toggleBtn.textContent = 'No explanation';
    }

    return node;
  }

  function clearContent() {
    content.innerHTML = '';
  }

  function renderRows(rows) {
    clearContent();
    if (!rows || !rows.length) {
      const empty = el('div', 'empty', 'No questions found in this CSV.');
      content.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    rows.forEach((row) => frag.appendChild(renderQuestion(row)));
    content.appendChild(frag);
  }

  async function fetchCsv(url) {
    setStatus('Loading…');
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        header: true,
        skipEmptyLines: true,
        download: true,
        complete: (res) => {
          setStatus('');
          resolve(res.data || []);
        },
        error: (err) => {
          setStatus('');
          reject(err);
        },
      });
    });
  }

  async function loadYear(year) {
    const primary = yearToCsv[year];
    const fallback = fallbackPath(year);
    try {
      const rows = await fetchCsv(primary);
      renderRows(rows);
    } catch (_) {
      try {
        const rows = await fetchCsv(fallback);
        renderRows(rows);
      } catch (e2) {
        clearContent();
        const msg = el('div', 'empty');
        msg.innerHTML = `Failed to load CSV for year <b>${year}</b>.<br/>Tried: <code>${primary}</code> and <code>${fallback}</code>.`;
        content.appendChild(msg);
      }
    }
  }

  function initYears() {
    const years = Object.keys(yearToCsv)
      .map((y) => parseInt(y, 10))
      .sort((a, b) => b - a);
    years.forEach((y, i) => {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      if (i === 0) opt.selected = true;
      yearSelect.appendChild(opt);
    });
  }

  function bindUI() {
    loadBtn.addEventListener('click', () => {
      const year = parseInt(yearSelect.value, 10);
      if (!year) return;
      loadYear(year);
    });

    // Immediate load for the default selected year
    const initial = parseInt(yearSelect.value, 10);
    if (initial) loadYear(initial);
  }

  function warnIfFileProtocol() {
    if (location.protocol === 'file:') {
      setStatus('Tip: Serve this folder over HTTP (e.g., VS Code Live Server) to avoid file:// fetch restrictions.');
    }
  }

  initYears();
  bindUI();
  warnIfFileProtocol();
})();


