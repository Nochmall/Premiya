'use strict';
/* Живая заявка: настоящий выбор фотографий, уменьшение в браузере и отправка на сервер.
   Подключается после основного скрипта страницы и заменяет его заглушки:
   кнопки клонируются, вместе с клоном пропадают прежние обработчики. */
(function () {
  var MAX = 3;                    // сколько снимков принимаем
  var MAX_BYTES = 10 * 1024 * 1024;
  var SIDE = 1600;                // до скольких точек уменьшаем длинную сторону
  var chosen = [];                // { name, token, bytes }

  var fileBtn = document.getElementById('fileBtn');
  var fileName = document.getElementById('fileName');
  var sendBtn = document.getElementById('send');
  var box = document.querySelector('.filebox');
  if (!fileBtn || !sendBtn) return;

  // --- свои кнопки вместо демонстрационных ---
  var newFileBtn = fileBtn.cloneNode(true);
  fileBtn.parentNode.replaceChild(newFileBtn, fileBtn);
  fileBtn = newFileBtn;

  var newSend = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSend, sendBtn);
  sendBtn = newSend;

  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/heic,image/heif,image/webp';
  input.multiple = true;
  input.hidden = true;
  document.body.appendChild(input);

  function say(t) { if (fileName) fileName.textContent = t; }

  function listNames() {
    if (!chosen.length) return say('Перетащите файлы сюда или выберите на устройстве');
    say(chosen.map(function (f) { return f.name; }).join(', ') + ' — выбрано ' + chosen.length + ' из ' + MAX);
  }

  // Уменьшаем прямо в браузере: на сервер уезжает около 300–500 КБ вместо 5 МБ.
  function shrink(file) {
    return new Promise(function (resolve) {
      if (!window.createImageBitmap || !document.createElement('canvas').getContext) return resolve(file);
      createImageBitmap(file).then(function (bmp) {
        var k = Math.min(1, SIDE / Math.max(bmp.width, bmp.height));
        if (k === 1 && file.size < 900 * 1024) { bmp.close && bmp.close(); return resolve(file); }
        var cv = document.createElement('canvas');
        cv.width = Math.round(bmp.width * k);
        cv.height = Math.round(bmp.height * k);
        var ctx = cv.getContext('2d');
        ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
        bmp.close && bmp.close();
        cv.toBlob(function (blob) {
          resolve(blob && blob.size < file.size ? blob : file);
        }, 'image/jpeg', 0.85);
      }).catch(function () { resolve(file); });   // HEIC не во всех браузерах читается — шлём как есть
    });
  }

  function upload(blob, name) {
    return fetch('/api/photo', {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body: blob
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) throw new Error(d.message || 'Не удалось загрузить снимок');
        return { name: name, token: d.token, bytes: d.bytes };
      });
    });
  }

  function take(files) {
    var list = Array.prototype.slice.call(files, 0, MAX - chosen.length);
    if (!list.length) { say('Больше трёх фотографий не нужно'); return; }
    var big = list.filter(function (f) { return f.size > MAX_BYTES; });
    if (big.length) { say('Снимок больше 10 МБ: ' + big[0].name); return; }

    say('Загружаем…');
    fileBtn.disabled = true;
    Promise.all(list.map(function (f) {
      return shrink(f).then(function (b) { return upload(b, f.name); });
    })).then(function (done) {
      chosen = chosen.concat(done);
      listNames();
    }).catch(function (e) {
      say(e.message || 'Не получилось загрузить. Попробуйте ещё раз.');
    }).finally(function () {
      fileBtn.disabled = false;
      input.value = '';
    });
  }

  fileBtn.addEventListener('click', function () { input.click(); });
  input.addEventListener('change', function () { if (input.files && input.files.length) take(input.files); });

  if (box) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      box.addEventListener(ev, function (e) { e.preventDefault(); box.style.borderColor = 'var(--red)'; });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      box.addEventListener(ev, function (e) { e.preventDefault(); box.style.borderColor = ''; });
    });
    box.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) take(e.dataTransfer.files);
    });
  }

  // --- отправка заявки ---
  function pressed(container) {
    var el = container && container.querySelector('[aria-pressed="true"]');
    return el || null;
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  sendBtn.addEventListener('click', function () {
    var kindBtn = pressed(document.getElementById('choice'));
    var nomBtn = pressed(document.getElementById('chips'));
    var kind = kindBtn ? kindBtn.getAttribute('data-kind') : '';
    var nameHidden = document.getElementById('mynameField').hidden;
    var tgHidden = document.getElementById('myTgField').hidden;

    var data = {
      kind: kind,
      hero_name: val('hero'),
      contact_type: val('ctype'),
      contact: val('hcontact'),
      nomination: nomBtn ? nomBtn.textContent.trim() : '',
      story: val('story'),
      author_name: nameHidden ? val('hero') : val('myname'),
      author_city: val('city'),
      author_tg: tgHidden ? val('hcontact') : val('tg'),
      author_mail: val('mail'),
      consent: document.getElementById('c1').checked,
      photos: chosen.map(function (f) { return f.token; })
    };

    var err2 = document.getElementById('err2');
    var ok = data.author_city.length > 1 && data.author_mail.indexOf('@') > 0 && data.consent &&
             (nameHidden || data.author_name.length > 1) && (tgHidden || val('tg').length > 2);
    err2.classList.toggle('show', !ok);
    if (!ok) return;

    if (!data.photos.length) {
      err2.textContent = 'Вернитесь на первый шаг и добавьте хотя бы одну фотографию.';
      err2.classList.add('show');
      return;
    }

    sendBtn.disabled = true;
    var wasText = sendBtn.textContent;
    sendBtn.textContent = 'Отправляем…';

    fetch('/api/zayavka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw d; return d; });
    }).then(function (d) {
      document.getElementById('pane2').hidden = true;
      var done = document.getElementById('donePane');
      done.hidden = false;
      var step = document.getElementById('stepName');
      if (step) step.textContent = 'Заявка отправлена';
      document.getElementById('ticketNo').textContent = d.ticket;
      var dt = document.getElementById('doneText');
      if (dt) dt.textContent = (kind === 'self')
        ? "Мы прочитаем вашу историю и обязательно вам напишем. А это ваш лотерейный билет — он участвует в розыгрыше подарков на вручении премии в прямом эфире."
        : "Мы прочитаем историю и свяжемся с героем. А это ваш лотерейный билет — он участвует в розыгрыше подарков на вручении премии в прямом эфире.";
      done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chosen = [];
    }).catch(function (d) {
      var msg = d && d.message ? d.message
        : (d && d.fields ? 'Проверьте заполнение: не хватает данных на первом шаге.'
                         : 'Не получилось отправить. Проверьте связь и попробуйте ещё раз.');
      err2.textContent = msg;
      err2.classList.add('show');
    }).finally(function () {
      sendBtn.disabled = false;
      sendBtn.textContent = wasText;
    });
  });
})();
