/* Local-only writing surface. Exports are explicit downloads, never submissions. */
(function(){
  window.W=window.W||{};
  window.W.notebook=el=>{
    const N=window.ITMNotebook,esc=window.K.esc,cat=[...window.ITMCaseCatalog,{id:'story',title:'Who gets the ball?',slug:'story-circuit'}];
    if(!N){el.innerHTML='<p>The notebook could not load. Reload this page; existing notes remain in your browser storage.</p>';return;}
    let storage;try{storage=localStorage;}catch(_){storage=null;}
    let data=N.load(storage),id=new URLSearchParams(location.search).get('case')||'place',message='',pending=null,erase=false;
    if(!N.IDS.includes(id))id='place';
    let persisted=N.save(storage,data),drafts={};
    function freshData(){try{return N.normalize(JSON.parse(storage.getItem(N.KEY)||'null'));}catch(_){persisted=false;return data;}}
    const prompts={question:'What behavior are you investigating?',prediction:'What do you expect before running the experiment?',intervention:'What changed? What stayed fixed? Include the input and component.',observation:'What did you measure? Record values, not just whether the answer looked right.',conclusion:'Which explanation does the evidence support?',limitations:'What alternative explanation remains? Where might this fail?'};
    function render(preserveDraft=true){
      const form=el.querySelector('[data-notes]');if(preserveDraft&&form)drafts[form.dataset.notes]=capture(form);
      const note=drafts[id]||data.notes[id]||{},first=data.events.filter(e=>e.type==='transfer'&&e.attempt===1&&!e.practice),correct=first.filter(e=>e.correct).length;
      const complete=new Set(data.events.filter(e=>e.type==='completed').map(e=>e.caseId)).size,days=new Set(data.events.filter(e=>e.type==='case-open').map(e=>new Date(e.at).toLocaleDateString())).size;
      el.innerHTML='<div class="iv nb"><p>'+ (persisted?'Your notes and activity stay in this browser. Download a backup to keep or share them.':'Browser storage is unavailable. You can write and export notes in this page, but they will not survive leaving it.')+'</p><label for="nb-case">Investigation</label><select id="nb-case">'+cat.map(c=>'<option value="'+c.id+'"'+(id===c.id?' selected':'')+'>'+esc(c.title)+'</option>').join('')+'</select><p><a href="/cases/'+cat.find(c=>c.id===id).slug+'/">Open this investigation</a></p><form data-notes="'+id+'">'+N.FIELDS.map(f=>'<label class="nb-field" for="nb-'+f+'">'+f[0].toUpperCase()+f.slice(1)+'<span>'+prompts[f]+'</span></label><textarea id="nb-'+f+'" name="'+f+'" maxlength="2000" rows="4">'+esc(note[f]||'')+'</textarea>').join('')+'<button type="submit" class="btn">Save evidence notes</button></form><p role="status" tabindex="-1" class="nb-message">'+esc(message)+'</p><section><h3>Keep a portable copy</h3><p>Markdown is useful for a write-up. JSON can restore your notes here. Nothing is sent to the site or a researcher.</p><label class="nb-include"><input type="checkbox" data-timeline> Include my local learning activity in the JSON export</label><div class="iv-tools"><button type="button" data-export="md">Download Markdown</button><button type="button" data-export="json">Download JSON backup</button></div><p class="iv-note">Exports include saved notes. Save your current edits first. Free-text notes can identify you; review them before sharing.</p><label for="nb-import">Choose a JSON backup to restore</label><input type="file" id="nb-import" accept=".json,application/json">'+(pending?'<p>Backup contains '+Object.keys(pending.notes).length+' case notes. Restoring replaces the notebook and its activity, including unsaved changes.</p><button type="button" class="btn" data-restore>Restore this backup</button>':'')+'</section><section><h3>Your local learning activity</h3><p>'+complete+' guided cases completed; '+correct+' of '+first.length+' first attempts matched an unseen example; activity on '+days+' calendar days.</p><p class="iv-note">These are descriptive local records, not a validated assessment of ability. Only the latest 200 events are retained. The advanced story case does not record these assessment events.</p><div class="iv-tools"><button type="button" data-erase>'+(erase?'Confirm erase notebook and activity':'Erase notebook and activity')+'</button>'+(erase?'<button type="button" data-cancel>Cancel</button>':'')+'</div><p class="iv-note">Erasing the notebook does not erase case progress. Keep a backup if you want to restore your notes.</p></section><p><a href="/beta/">Beta-session guide</a> · <a href="/teach/">Teach with the investigations</a> · <a href="/methods/">Methods and privacy</a></p></div>';
    }
    function capture(form=el.querySelector('[data-notes]')){return Object.fromEntries(N.FIELDS.map(f=>[f,form.elements[f].value]));}
    function saveNote(){
      const fresh=persisted?freshData():data;fresh.notes[id]=capture();data=N.normalize(fresh);persisted=N.save(storage,data);
      if(persisted){N.record(storage,id,'note-saved');data=N.load(storage);}
      message=persisted?'Notes saved in this browser.':'Notes kept for this page session. Download a backup before leaving.';
    }
    el.addEventListener('submit',e=>{if(!e.target.matches('[data-notes]'))return;e.preventDefault();saveNote();render();el.querySelector('.nb-message').focus?.();});
    el.addEventListener('change',async e=>{
      if(e.target.id==='nb-case'){const next=e.target.value;saveNote();id=next;message='';render();return;}
      if(e.target.id==='nb-import'){
        const file=e.target.files?.[0];if(!file)return;
        try{if(file.size>1000000)throw Error('This backup is larger than 1 MB. Choose a notebook export.');const parsed=JSON.parse(await file.text());if(parsed.version!==1||!parsed.notes||typeof parsed.notes!=='object'||Array.isArray(parsed.notes))throw Error('This is not a version 1 notebook backup.');pending=N.normalize(parsed);message='Backup checked. Select Restore this backup to replace your notebook.';}catch(err){pending=null;message=err.message||'Could not read that backup.';}render();
      }
    });
    el.addEventListener('click',e=>{
      const exportButton=e.target.closest('[data-export]');
      if(exportButton){
        if(persisted)data=freshData();
        const json=exportButton.dataset.export==='json',include=el.querySelector('[data-timeline]').checked;
        const payload=json?JSON.stringify({...data,events:include?data.events:[]},null,2):N.markdown(data);
        const url=URL.createObjectURL(new Blob([payload],{type:json?'application/json':'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='inside-the-model-notebook.'+(json?'json':'md');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
      }
      if(e.target.closest('[data-restore]')){drafts={};data=pending;pending=null;persisted=N.save(storage,data);message=persisted?'Backup restored.':'Backup opened for this page session; browser storage is unavailable.';render(false);}
      if(e.target.closest('[data-erase]')){if(erase){drafts={};data=N.normalize(null);persisted=N.save(storage,data);message='Notebook and local activity erased.';erase=false;render(false);}else{erase=true;render();}}
      if(e.target.closest('[data-cancel]')){erase=false;render();}
    });
    render();
  };
})();
