// Lesson building blocks: what each block type looks like for learners, and
// which fields the admin course editor shows for it. Plain script (needs ui.js).
//
// Field types used by the editor:
//   text      single line            md      text box with light formatting (see md() in ui.js)
//   lines     one item per line      number  number box
//   select    drop-down              check   tick box
//   media     upload/pick a picture or video, or paste a link
//   rows      a repeating list of sub-fields (cards, statements, options...)

const BLOCK_TYPES = {
  text: {
    label: 'Text', icon: '📝', interactive: false,
    fields: [{ key: 'text', label: 'Text', type: 'md' }],
  },
  callout: {
    label: 'Key point box', icon: '💡', interactive: false,
    fields: [
      { key: 'style', label: 'Style', type: 'select', options: [['info', 'Key point (teal)'], ['warn', 'Important / warning (red)']] },
      { key: 'label', label: 'Heading', type: 'text', placeholder: 'e.g. Remember' },
      { key: 'text', label: 'Text', type: 'md' },
    ],
  },
  image: {
    label: 'Picture', icon: '🖼️', interactive: false,
    fields: [
      { key: 'url', label: 'Picture', type: 'media', accept: 'image' },
      { key: 'size', label: 'Size', type: 'select', options: [['full', 'Full width'], ['large', 'Large'], ['medium', 'Medium'], ['small', 'Small']] },
      { key: 'alt', label: 'Description for screen readers', type: 'text' },
      { key: 'caption', label: 'Caption (optional)', type: 'text' },
    ],
  },
  video: {
    label: 'Video', icon: '🎬', interactive: false,
    fields: [
      { key: 'url', label: 'Video', type: 'media', accept: 'video', help: 'Upload a short video, or paste a YouTube or Vimeo link. For anything over a couple of minutes, an unlisted YouTube video is best.' },
      { key: 'caption', label: 'Caption (optional)', type: 'text' },
    ],
  },
  flipcards: {
    label: 'Flip cards', icon: '🃏', interactive: false,
    fields: [
      { key: 'title', label: 'Heading (optional)', type: 'text', placeholder: 'e.g. Key terms' },
      { key: 'cards', label: 'Cards', type: 'rows', item: 'Card', fields: [
        { key: 'front', label: 'Front', type: 'text' },
        { key: 'back', label: 'Back', type: 'md', short: true },
      ] },
    ],
  },
  check: {
    label: 'Knowledge check', icon: '❓', interactive: true,
    fields: [
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'options', label: 'Answer options (one per line)', type: 'lines' },
      { key: 'answer', label: 'Correct option number (1 = first line)', type: 'number', min: 1 },
      { key: 'explain', label: 'Explanation shown after answering', type: 'md', short: true },
    ],
  },
  truefalse: {
    label: 'True or false', icon: '⚖️', interactive: true,
    fields: [
      { key: 'title', label: 'Heading (optional)', type: 'text' },
      { key: 'items', label: 'Statements', type: 'rows', item: 'Statement', fields: [
        { key: 'statement', label: 'Statement', type: 'text' },
        { key: 'answer', label: 'Answer', type: 'select', options: [['true', 'True'], ['false', 'False']] },
        { key: 'explain', label: 'Explanation', type: 'text' },
      ] },
    ],
  },
  scenario: {
    label: 'Scenario', icon: '🎭', interactive: true,
    fields: [
      { key: 'title', label: 'Heading', type: 'text', placeholder: 'e.g. What would you do?' },
      { key: 'situation', label: 'The situation', type: 'md', short: true },
      { key: 'options', label: 'Choices', type: 'rows', item: 'Choice', fields: [
        { key: 'text', label: 'Choice', type: 'text' },
        { key: 'best', label: 'This is the best choice', type: 'check' },
        { key: 'feedback', label: 'Feedback when chosen', type: 'text' },
      ] },
    ],
  },
  reveal: {
    label: 'Click to reveal', icon: '🔽', interactive: false,
    fields: [
      { key: 'title', label: 'Heading (optional)', type: 'text' },
      { key: 'items', label: 'Sections', type: 'rows', item: 'Section', fields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'text', label: 'Hidden text', type: 'md', short: true },
      ] },
    ],
  },
  sort: {
    label: 'Sort into groups', icon: '🗂️', interactive: true,
    fields: [
      { key: 'prompt', label: 'Instructions', type: 'text', placeholder: 'e.g. Sort each item into the right group' },
      { key: 'categories', label: 'Group names (one per line)', type: 'lines' },
      { key: 'items', label: 'Items', type: 'rows', item: 'Item', fields: [
        { key: 'text', label: 'Item', type: 'text' },
        { key: 'cat', label: 'Correct group number (1 = first group)', type: 'number', min: 1 },
      ] },
    ],
  },
  order: {
    label: 'Put in order', icon: '🔢', interactive: true,
    fields: [
      { key: 'prompt', label: 'Instructions', type: 'text', placeholder: 'e.g. Put these steps in the right order' },
      { key: 'steps', label: 'Steps in the CORRECT order (one per line, they are shuffled for learners)', type: 'lines' },
    ],
  },
};

function blankBlock(type) {
  const b = { type };
  for (const f of BLOCK_TYPES[type].fields) {
    b[f.key] = f.type === 'rows' ? [] : f.type === 'lines' ? [] : f.type === 'number' ? 1 : f.type === 'check' ? false
      : f.type === 'select' ? f.options[0][0] : '';
  }
  return b;
}

function videoEmbed(url) {
  let m;
  if ((m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)))
    return '<div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(m[1]) + '" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div>';
  if ((m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/)))
    return '<div class="video-wrap"><iframe src="https://player.vimeo.com/video/' + esc(m[1]) + '" allowfullscreen allow="fullscreen; picture-in-picture"></iframe></div>';
  return '<video controls preload="metadata" src="' + esc(url) + '"></video>';
}

function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

// Builds one block for learners. onAttempt() is called the first time an
// interactive block is answered, so the lesson knows it has been engaged with.
function renderBlock(b, onAttempt) {
  let attempted = false;
  const tried = () => { if (!attempted) { attempted = true; onAttempt && onAttempt(); } };
  const wrap = document.createElement('div');
  wrap.className = 'block';

  switch (b.type) {
    case 'text':
      wrap.innerHTML = '<div class="md">' + md(b.text) + '</div>';
      break;

    case 'callout':
      wrap.innerHTML = '<div class="callout' + (b.style === 'warn' ? ' callout-warn' : '') + '" style="margin:0">'
        + (b.label ? '<div class="callout-label">' + esc(b.label) + '</div>' : '') + '<div class="md">' + md(b.text) + '</div></div>';
      break;

    case 'image':
      if (!b.url) break;
      wrap.innerHTML = '<figure class="media-fig size-' + esc(b.size || 'full') + '"><img src="' + esc(b.url) + '" alt="' + esc(b.alt || '') + '" loading="lazy"/>'
        + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
      break;

    case 'video':
      if (!b.url) break;
      wrap.innerHTML = '<figure class="media-fig">' + videoEmbed(b.url) + (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
      break;

    case 'flipcards': {
      wrap.innerHTML = '<div class="activity"><div class="activity-label">🃏 Flip cards</div>' + (b.title ? '<div class="activity-q">' + esc(b.title) + '</div>' : '')
        + '<div class="flip-grid"></div><div class="flip-hint">Tap a card to turn it over.</div></div>';
      const grid = wrap.querySelector('.flip-grid');
      (b.cards || []).forEach(c => {
        const card = el('<button type="button" class="flip"><div class="flip-inner"><div class="flip-face flip-front">' + esc(c.front) + '</div><div class="flip-face flip-back"><div class="md">' + md(c.back) + '</div></div></div></button>');
        card.onclick = () => card.classList.toggle('flipped');
        grid.appendChild(card);
      });
      break;
    }

    case 'check': {
      const opts = b.options || [];
      wrap.innerHTML = '<div class="activity"><div class="activity-label">❓ Knowledge check</div><div class="activity-q">' + esc(b.question) + '</div><div class="quiz-options"></div><div class="fb"></div></div>';
      const box = wrap.querySelector('.quiz-options');
      opts.forEach((o, i) => {
        const opt = el('<div class="quiz-option"><span class="quiz-option-key">' + 'ABCDEFGH'[i] + '</span><span>' + esc(o) + '</span></div>');
        opt.onclick = () => {
          if (box.dataset.done) return;
          box.dataset.done = '1';
          const right = i + 1 === Number(b.answer);
          box.querySelectorAll('.quiz-option').forEach((x, j) => { x.classList.add('disabled'); if (j + 1 === Number(b.answer)) x.classList.add('correct'); });
          if (!right) opt.classList.add('wrong');
          wrap.querySelector('.fb').innerHTML = '<div class="act-feedback ' + (right ? 'good' : 'bad') + '"><strong>' + (right ? 'Correct.' : 'Not quite.') + '</strong>' + (b.explain ? '<div class="md" style="margin-top:0.35rem">' + md(b.explain) + '</div>' : '') + '</div>';
          tried();
        };
        box.appendChild(opt);
      });
      break;
    }

    case 'truefalse': {
      wrap.innerHTML = '<div class="activity"><div class="activity-label">⚖️ True or false</div>' + (b.title ? '<div class="activity-q">' + esc(b.title) + '</div>' : '') + '<div class="tf-list"></div></div>';
      const list = wrap.querySelector('.tf-list');
      const items = b.items || [];
      let answered = 0;
      items.forEach(it => {
        const row = el('<div class="tf-row"><div>' + esc(it.statement) + '</div><div class="tf-btns"><button type="button" class="chip" data-v="true">True</button><button type="button" class="chip" data-v="false">False</button></div><div class="fb"></div></div>');
        row.querySelectorAll('button').forEach(btn => btn.onclick = () => {
          if (row.dataset.done) return;
          row.dataset.done = '1';
          const right = btn.dataset.v === String(it.answer);
          btn.classList.add('active');
          row.querySelector('.fb').innerHTML = '<div class="act-feedback ' + (right ? 'good' : 'bad') + '"><strong>' + (right ? 'Correct' : 'Not quite') + ' - this is ' + (String(it.answer) === 'true' ? 'true' : 'false') + '.</strong> ' + esc(it.explain || '') + '</div>';
          if (++answered === items.length) tried();
        });
        list.appendChild(row);
      });
      if (!items.length) tried();
      break;
    }

    case 'scenario': {
      wrap.innerHTML = '<div class="activity"><div class="activity-label">🎭 Scenario</div>' + (b.title ? '<div class="activity-q">' + esc(b.title) + '</div>' : '')
        + '<div class="md" style="margin-bottom:0.85rem">' + md(b.situation) + '</div><div class="quiz-options"></div><div class="fb"></div></div>';
      const box = wrap.querySelector('.quiz-options');
      (b.options || []).forEach(o => {
        const opt = el('<div class="quiz-option"><span>' + esc(o.text) + '</span></div>');
        opt.onclick = () => {
          box.querySelectorAll('.quiz-option').forEach(x => x.classList.remove('correct', 'wrong'));
          opt.classList.add(o.best ? 'correct' : 'wrong');
          wrap.querySelector('.fb').innerHTML = '<div class="act-feedback ' + (o.best ? 'good' : 'bad') + '"><strong>' + (o.best ? 'Good choice.' : 'Think again.') + '</strong> ' + esc(o.feedback || '') + '</div>';
          tried();
        };
        box.appendChild(opt);
      });
      break;
    }

    case 'reveal': {
      wrap.innerHTML = (b.title ? '<h3 style="margin-bottom:0.6rem">' + esc(b.title) + '</h3>' : '')
        + (b.items || []).map(it => '<details class="reveal-item"><summary>' + esc(it.title) + '</summary><div class="md">' + md(it.text) + '</div></details>').join('');
      break;
    }

    case 'sort': {
      const cats = b.categories || [];
      const items = shuffle((b.items || []).map((it, i) => ({ ...it, i })));
      const choice = {};
      wrap.innerHTML = '<div class="activity"><div class="activity-label">🗂️ Sort into groups</div><div class="activity-q">' + esc(b.prompt || 'Sort each item into the right group') + '</div><div class="sort-list"></div>'
        + '<button type="button" class="btn btn-primary btn-sm chk" style="margin-top:0.5rem">Check my answers</button><div class="fb"></div></div>';
      const list = wrap.querySelector('.sort-list');
      items.forEach(it => {
        const row = el('<div class="sort-item"><span>' + esc(it.text) + '</span><span class="sort-btns">' + cats.map((c, ci) => '<button type="button" class="chip" data-c="' + (ci + 1) + '">' + esc(c) + '</button>').join('') + '</span></div>');
        row.querySelectorAll('button').forEach(btn => btn.onclick = () => {
          row.querySelectorAll('button').forEach(x => x.classList.remove('active'));
          btn.classList.add('active'); choice[it.i] = Number(btn.dataset.c); row.classList.remove('good', 'bad');
        });
        row.dataset.i = it.i;
        list.appendChild(row);
      });
      wrap.querySelector('.chk').onclick = () => {
        if (Object.keys(choice).length < items.length) { wrap.querySelector('.fb').innerHTML = '<div class="act-feedback info">Sort every item first.</div>'; return; }
        let right = 0;
        list.querySelectorAll('.sort-item').forEach(row => {
          const it = b.items[row.dataset.i]; const ok = choice[row.dataset.i] === Number(it.cat);
          row.classList.toggle('good', ok); row.classList.toggle('bad', !ok); if (ok) right++;
        });
        wrap.querySelector('.fb').innerHTML = '<div class="act-feedback ' + (right === items.length ? 'good' : 'bad') + '"><strong>' + right + ' of ' + items.length + ' correct.</strong>' + (right < items.length ? ' Move the red ones and check again.' : '') + '</div>';
        tried();
      };
      break;
    }

    case 'order': {
      const steps = b.steps || [];
      let cur = shuffle(steps.map((s, i) => i));
      if (steps.length > 1 && cur.every((v, i) => v === i)) cur.reverse();
      wrap.innerHTML = '<div class="activity"><div class="activity-label">🔢 Put in order</div><div class="activity-q">' + esc(b.prompt || 'Put these in the right order') + '</div><div class="order-list"></div>'
        + '<button type="button" class="btn btn-primary btn-sm chk" style="margin-top:0.5rem">Check my order</button><div class="fb"></div></div>';
      const list = wrap.querySelector('.order-list');
      const draw = (mark) => {
        list.innerHTML = '';
        cur.forEach((si, pos) => {
          const ok = mark ? si === pos : null;
          const row = el('<div class="order-item' + (ok === true ? ' good' : ok === false ? ' bad' : '') + '"><span class="oi-n">' + (pos + 1) + '</span><span class="oi-t">' + esc(steps[si]) + '</span>'
            + '<button type="button" class="mini-btn" aria-label="Move up"' + (pos === 0 ? ' disabled' : '') + '>▲</button><button type="button" class="mini-btn" aria-label="Move down"' + (pos === cur.length - 1 ? ' disabled' : '') + '>▼</button></div>');
          const [up, down] = row.querySelectorAll('button');
          up.onclick = () => { [cur[pos - 1], cur[pos]] = [cur[pos], cur[pos - 1]]; draw(false); };
          down.onclick = () => { [cur[pos + 1], cur[pos]] = [cur[pos], cur[pos + 1]]; draw(false); };
          list.appendChild(row);
        });
      };
      draw(false);
      wrap.querySelector('.chk').onclick = () => {
        draw(true);
        const right = cur.filter((si, pos) => si === pos).length;
        wrap.querySelector('.fb').innerHTML = '<div class="act-feedback ' + (right === steps.length ? 'good' : 'bad') + '"><strong>' + (right === steps.length ? 'All in the right order.' : right + ' of ' + steps.length + ' in the right place.') + '</strong>' + (right < steps.length ? ' Use the arrows to move the red ones and check again.' : '') + '</div>';
        tried();
      };
      break;
    }
  }
  return wrap;
}
