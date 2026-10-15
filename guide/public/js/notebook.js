/* Optional private scratchpad. Notes never leave the browser unless exported. */
(function () {
  window.W = window.W || {};
  window.W.notebook = el => {
    const N = window.ITMNotebook, esc = window.K.esc;
    const catalog = [...window.ITMCaseCatalog, { id: 'story', title: 'Who gets the ball?', slug: 'story-circuit' }];
    if (!N) { el.innerHTML = '<p>Notes could not load. Reload this page; saved notes remain in your browser.</p>'; return; }
    let storage; try { storage = localStorage; } catch (_) { storage = null; }
    let data = N.load(storage), id = new URLSearchParams(location.search).get('case') || 'place';
    if (!N.IDS.includes(id)) id = 'place';
    let persisted = N.save(storage, data), drafts = {}, message = '', pending = null, erase = false, dirty = false, timer;
    function freshData() {
      try { return N.normalize(JSON.parse(storage.getItem(N.KEY) || 'null')); }
      catch (_) { persisted = false; return data; }
    }
    function capture(form = el.querySelector('[data-notes]')) { return { text: form.elements.notes.value }; }
    function showStatus() {
      el.querySelector('.nb-message').textContent = message;
      el.querySelector('.nb-storage').textContent = persisted
        ? 'Saved on this device. No account or submission.'
        : 'Browser storage is unavailable. Download a backup before leaving to keep your notes.';
    }
    function saveNote(explicit = false) {
      clearTimeout(timer);
      const fresh = persisted ? freshData() : data;
      fresh.notes[id] = capture(); data = N.normalize(fresh); drafts[id] = data.notes[id];
      persisted = N.save(storage, data); dirty = !persisted;
      if (persisted && explicit) { N.record(storage, id, 'note-saved'); data = N.load(storage); }
      message = persisted ? 'Saved.' : 'Kept for this page session. Download a backup before leaving.';
      showStatus();
    }
    function render(preserve = true) {
      const form = el.querySelector('[data-notes]'), open = pending || erase || el.querySelector('.nb-backup')?.open;
      if (preserve && form) drafts[form.dataset.notes] = capture(form);
      const note = drafts[id] || data.notes[id] || {};
      el.innerHTML = '<div class="iv nb"><p class="nb-storage"></p><label for="nb-case">Investigation</label><select id="nb-case">' +
        catalog.map(c => '<option value="' + c.id + '"' + (id === c.id ? ' selected' : '') + '>' + esc(c.title) + '</option>').join('') +
        '</select><p><a href="/cases/' + catalog.find(c => c.id === id).slug + '/">Back to the investigation</a></p>' +
        '<form data-notes="' + id + '"><label class="nb-field" for="nb-notes">Your notes</label><textarea id="nb-notes" name="notes" maxlength="16000" rows="12" aria-describedby="nb-help" placeholder="A result, a question, an idea to come back to…">' + esc(N.noteText(note)) +
        '</textarea><p class="iv-note" id="nb-help">Write whatever is useful to you. Notes save automatically in this browser.</p><button class="btn" type="submit">Save notes</button></form><p role="status" tabindex="-1" class="nb-message">' + esc(message) + '</p>' +
        '<details class="nb-backup"' + (open ? ' open' : '') + '><summary>Back up or restore notes</summary><p>Download Markdown for your own write-up, or JSON to restore your notes later. Exports include your current edits. Nothing is submitted.</p>' +
        '<label class="nb-include"><input type="checkbox" data-timeline> Include local experiment activity in the JSON backup</label><p class="iv-note">Activity is limited to the latest 200 events. Review notes before sharing them.</p><div class="iv-tools"><button type="button" data-export="md">Download Markdown</button><button type="button" data-export="json">Download JSON backup</button></div>' +
        '<label for="nb-import">Choose a JSON backup</label><input type="file" id="nb-import" accept=".json,application/json">' +
        (pending ? '<p>Backup contains ' + Object.keys(pending.notes).length + ' sets of notes. Restoring replaces the current notes and local activity.</p><button class="btn" type="button" data-restore>Restore this backup</button>' : '') +
        '<div class="iv-tools"><button type="button" data-erase>' + (erase ? 'Confirm erase notes and activity' : 'Erase notes and activity') + '</button>' + (erase ? '<button type="button" data-cancel>Cancel</button>' : '') + '</div><p class="iv-note">Case progress is stored separately and is not erased here.</p></details><p class="iv-note"><a href="/methods/">How local storage and privacy work</a></p></div>';
      showStatus();
    }
    el.addEventListener('input', e => {
      if (e.target.id !== 'nb-notes') return;
      dirty = true; message = 'Saving…'; showStatus(); clearTimeout(timer);
      timer = setTimeout(() => saveNote(), 400);
    });
    el.addEventListener('submit', e => { if (!e.target.matches('[data-notes]')) return; e.preventDefault(); saveNote(true); });
    el.addEventListener('change', async e => {
      if (e.target.id === 'nb-case') { const next = e.target.value; saveNote(); id = next; message = ''; render(); return; }
      if (e.target.id !== 'nb-import') return;
      const file = e.target.files?.[0]; if (!file) return;
      try {
        if (file.size > 1000000) throw Error('This file is larger than 1 MB. Choose a notes backup.');
        const parsed = JSON.parse(await file.text());
        if (parsed?.version !== 1 || !parsed.notes || typeof parsed.notes !== 'object' || Array.isArray(parsed.notes)) throw Error('This is not a supported notes backup.');
        pending = N.normalize(parsed); message = 'Backup checked. Select Restore this backup to replace your notes.';
      } catch (err) { pending = null; message = err.message || 'Could not read that backup.'; }
      render();
    });
    el.addEventListener('click', e => {
      const button = e.target.closest('[data-export]');
      if (button) {
        if (dirty) saveNote(); if (persisted) data = freshData();
        const json = button.dataset.export === 'json', include = el.querySelector('[data-timeline]').checked;
        const payload = json ? JSON.stringify({ ...data, events: include ? data.events : [] }, null, 2) : N.markdown(data);
        const url = URL.createObjectURL(new Blob([payload], { type: json ? 'application/json' : 'text/markdown;charset=utf-8' }));
        const a = document.createElement('a'); a.href = url; a.download = 'inside-the-model-notes.' + (json ? 'json' : 'md'); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      if (e.target.closest('[data-restore]') && pending) { clearTimeout(timer); drafts = {}; data = pending; pending = null; persisted = N.save(storage, data); dirty = !persisted; message = persisted ? 'Backup restored.' : 'Backup opened for this page session. Download it before leaving.'; render(false); }
      if (e.target.closest('[data-erase]')) {
        if (erase) { clearTimeout(timer); drafts = {}; data = N.normalize(null); persisted = N.save(storage, data); dirty = !persisted; message = 'Notes and activity erased.'; erase = false; render(false); }
        else { erase = true; render(); }
      }
      if (e.target.closest('[data-cancel]')) { erase = false; render(); }
    });
    window.addEventListener('beforeunload', e => { if (dirty) saveNote(); if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    render();
  };
})();
