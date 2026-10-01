'use strict';
(()=>{
 const data=window.TIMETABLE_DATA;
 const $=id=>document.getElementById(id);
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dayMs=86400000,base=Date.parse(data.meta.periodStart+'T12:00:00Z');
 const dateFrom=n=>new Date(base+n*dayMs).toISOString().slice(0,10);
 const weekOf=d=>Math.max(0,Math.min(17,Math.floor((Date.parse(d+'T12:00:00Z')-base)/(7*dayMs))));
 const fmt=(d,options)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',...options}).format(new Date(d+'T12:00:00Z'));
 const short=d=>fmt(d,{day:'numeric',month:'short'}).replace(/\./g,'');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const category={lab:'Лабораторная',tutorial:'Практика',project:'Проект',mixed:'Лекция + практика'};
 const load=k=>{try{return localStorage.getItem(k)}catch{return null}};
 const save=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
 let person=data.students[load('tt-person')]?load('tt-person'):'islam';
 let view=['week','list','groups'].includes(load('tt-view'))?load('tt-view'):'week';
 let week=weekOf(today<data.students[person].events[0].date?data.students[person].events[0].date:today);
 const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
 const duration=m=>m>=60?`${Math.floor(m/60)} ч${m%60?' '+m%60+' мин':''}`:`${m} мин`;
 const room=location=>location==='on-line'?'Онлайн':location.replaceAll('BUILDING ','').replaceAll(' ROOM ',' · ауд. ').replaceAll('IFE-','IFE · ауд. ');
 const group=g=>g.replace(' - group ',' · группа ').replace(' - Erasmus ',' · Erasmus ');
 const eventAt=e=>({...data.catalog[e.id],...e});
 const source=(e)=>{const w=weekOf(e.date),ts=base-12*3600000+w*7*dayMs;return`https://lodz.celcat.cloud/cal/?r=${data.students[person].resource}&v=list&z=1&w=${w}&dt=${ts}&dta=${ts}&e=${e.id}`;};
 const weekEvents=()=>data.students[person].events.filter(e=>weekOf(e.date)===week).map(eventAt);
 for(let w=0;w<18;w++)$('week-select').add(new Option(`${short(dateFrom(w*7))} – ${short(dateFrom(w*7+6))} ${dateFrom(w*7+6).slice(0,4)}`,w));
 $('people').innerHTML=Object.entries(data.students).map(([id,s])=>`<button data-person="${id}" aria-pressed="${id===person}">${escape(s.name)}</button>`).join('');
 $('people').addEventListener('click',e=>{const b=e.target.closest('[data-person]');if(!b)return;person=b.dataset.person;save('tt-person',person);render();});
 $('week-select').addEventListener('change',e=>{week=Number(e.target.value);render()});
 $('prev-week').addEventListener('click',()=>{week=Math.max(0,week-1);render()});
 $('next-week').addEventListener('click',()=>{week=Math.min(17,week+1);render()});
 $('today').addEventListener('click',()=>{week=weekOf(today);view=view==='groups'?'week':view;render()});
 document.querySelector('.views').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;view=b.dataset.view;save('tt-view',view);render()});

 function card(e){return`<button class="event ${e.category}${e.online?' online':''}" data-event="${e.id}" data-date="${e.date}" aria-label="${escape(e.title+', '+e.start+'–'+e.end+', '+group(e.group)+', '+room(e.location))}"><span class="event-top"><span class="event-time">${e.start} – ${e.end}</span><span class="event-type">${e.online?'<span class="online-pill">Онлайн</span>':category[e.category]}</span></span><span class="event-title">${escape(e.title)}</span><span class="event-group">${escape(group(e.group))}</span><span class="event-room">${escape(room(e.location))}</span><span class="event-staff">${escape(e.staff)}</span>${e.note?`<span class="event-note">${escape(e.note)}</span>`:''}</button>`;}
 function days(events){let html='';for(let d=0;d<7;d++){
  const date=dateFrom(week*7+d),es=events.filter(e=>e.date===date);
  if(!es.length&&(view==='list'||d>4))continue;
  html+=`<section class="day-section${es.length?'':' free-section'}"><h2 class="day-heading"><span>${escape(fmt(date,{weekday:'long'}).replace(/^./,c=>c.toUpperCase()))}</span><span class="date">${short(date)}</span><span class="day-count">${es.length?duration(es.reduce((n,e)=>n+minutes(e.end)-minutes(e.start),0)):''}</span></h2><div class="list-cards">`;
  if(!es.length)html+='<p class="free-day">Без занятий</p>';
  es.forEach((e,i)=>{if(i){const gap=minutes(e.start)-minutes(es[i-1].end);if(gap>0)html+=`<div class="gap">Перерыв ${duration(gap)}</div>`;}html+=card(e)});
  html+='</div></section>';
 }return html;}
 function timeline(events){let html='<div class="timeline" aria-label="Сетка недели"><div class="timeline-title">Время</div>';for(let d=0;d<5;d++){const date=dateFrom(week*7+d);html+=`<div class="timeline-title"><strong>${escape(fmt(date,{weekday:'long'}).replace(/^./,c=>c.toUpperCase()))}</strong><span>${short(date)}</span></div>`;}html+='<div class="timeline-axis" aria-hidden="true">';for(let h=8;h<20;h++)html+=`<span style="top:${(h-8)/12*100}%">${String(h).padStart(2,'0')}:00</span>`;html+='</div>';for(let d=0;d<5;d++){const date=dateFrom(week*7+d),es=events.filter(e=>e.date===date);html+=`<div class="timeline-day${es.length?'':' free'}">`;if(!es.length)html+='<div class="free-day">Без занятий</div>';for(const e of es)html+=card(e).replace('<button ',`<button style="top:${(minutes(e.start)-480)/720*100}%;height:calc(${(minutes(e.end)-minutes(e.start))/720*100}% - 4px)" `);html+='</div>';}return html+'</div>';}
 function notices(events){const texts=[];if(events.some(e=>e.id==='23572'&&e.date==='2026-10-01'))texts.push('1 октября уже есть Cloud Computing Systems: 14:00–15:30, B19 · ауд. 103.');if(events.some(e=>e.id==='24175'))texts.push('30 октября: Digital Systems 1 перенесён с 20 октября на пятницу, 14:15–15:45.');if(events.some(e=>['23939','24611','24093'].includes(e.id)))texts.push(person==='alal'?'9 ноября: Java онлайн в понедельник, 16:15–17:45.':'9 ноября: OOP и практика Electrical Circuits проходят в понедельник.');if(events.some(e=>['23940','24612','24094'].includes(e.id)))texts.push(person==='alal'?'22 декабря: Java онлайн во вторник, 16:15–17:45.':'22 декабря: OOP и практика Electrical Circuits проходят во вторник.');if(events.some(e=>e.id==='23860'&&e.date==='2026-12-23'))texts.push('23 декабря есть лабораторная Electrical Circuits, 12:15–13:45.');if(person==='alal'&&events.some(e=>e.id==='23580')&&events.some(e=>e.id==='23572'))texts.push('В четверг между IFE · ауд. 105 и B19 · ауд. 103 — 15 минут на переход.');if(person==='islam'&&week===1)texts.push('Economics for Managers начинается со следующей недели.');return texts.map(t=>`<p class="notice">${escape(t)}</p>`).join('');}
 function render(){const s=data.students[person],events=weekEvents();
  document.title=`${s.name} · Расписание 2026/27`;
  $('person-title').textContent=s.name;$('person-summary').textContent=s.summary;
  const pending=s.pendingSubjects||[];
  const badge=document.querySelector('.verified');badge.textContent=pending.length?'Предварительно':'Без пересечений';badge.classList.toggle('pending',pending.length>0);
  document.querySelector('.checked').textContent=`Проверено ${fmt(s.checkedAt,{day:'2-digit',month:'2-digit',year:'numeric'})}`;
  $('snapshot-date').textContent=`Данные на ${fmt(s.checkedAt,{day:'numeric',month:'long',year:'numeric'})}`;
  $('people').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.person===person));
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===view));
  $('week-select').value=week;$('prev-week').disabled=week===0;$('next-week').disabled=week===17;
  $('source-link').href=`https://lodz.celcat.cloud/cal/?r=${s.resource}&v=list&z=1&w=${week}&dt=${base-12*3600000+week*7*dayMs}&dta=${base-12*3600000+week*7*dayMs}`;
  const campus=new Set(events.filter(e=>!e.online).map(e=>e.date)).size,online=events.filter(e=>e.online).length;
  $('week-summary').innerHTML=view==='groups'?`<span><strong>${Object.keys(s.choices).length} предметов</strong></span><span>Группы закреплены на весь опубликованный период</span>`:`<span><strong>${events.length}</strong> занятий</span><span>Дней в университете: <strong>${campus}</strong></span>${online?`<span>Онлайн: <strong>${online}</strong></span>`:''}<span>${duration(events.reduce((n,e)=>n+minutes(e.end)-minutes(e.start),0))} занятий</span>`;
  const pendingNotice=pending.length?`<p class="notice pending-notice"><strong>Подтверждены ${Object.keys(s.choices).length} из ${s.requestedSubjectCount} предметов.</strong> ${escape(pending.join('; '))} пока не найден в CELCAT. План предварительный: пересечения с этим предметом ещё не проверены.</p>`:'';
  let extraNotices='';if(person==='mansur'&&events.some(e=>e.id==='24534'))extraNotices+='<p class="notice">9 ноября: Algorithms and Data Models в понедельник, 14:00–15:30. Internet of Things 11 ноября не указан.</p>';if(person==='mansur'&&events.some(e=>e.id==='24535'))extraNotices+='<p class="notice">22 декабря: Algorithms and Data Models во вторник, 14:00–15:30.</p>';if(person==='mansur'&&week===0)extraNotices+='<p class="notice">2 октября: Artificial Intelligence Fundamentals, 12:15–14:00, A12 · ауд. E109. Остальные выбранные занятия начинаются на следующей неделе.</p>';
  $('week-notices').innerHTML=pendingNotice+(view==='groups'?'':notices(events)+extraNotices);
  $('schedule').className=view==='week'?'weekly-view':'agenda';
  if(view==='groups'){$('schedule').className='';$('schedule').innerHTML=groups();return;}
  if(!events.length){const next=s.events.find(e=>e.date>=dateFrom(week*7+7));$('schedule').className='';$('schedule').innerHTML=`<div class="empty"><h2>${pending.length?'Подтверждённых занятий на этой неделе нет':'На этой неделе занятий нет'}</h2><p>В выбранных группах на эти даты CELCAT не показывает занятий.</p>${next?`<button class="primary-button" data-jump="${weekOf(next.date)}">К занятиям ${short(next.date)}</button>`:''}</div>`;}else $('schedule').innerHTML=view==='week'?timeline(events)+`<div class="board" style="--active-days:${Math.min(3,new Set(events.map(e=>e.date)).size)}">${days(events)}</div>`:days(events);
 }
 function groups(){const s=data.students[person];return`<p class="group-help">Одна группа на каждый предмет на весь период. Если занятие общее для нескольких групп, ваша группа указана в карточке, а полный состав — в подробностях.</p><div class="group-list">${Object.entries(s.choices).map(([sub,g])=>{const ids=[...new Set(s.events.filter(e=>data.catalog[e.id].subject===sub).map(e=>e.id))];return`<article class="group-card"><h3>${escape(data.subjects[sub])}</h3><div class="group-choice">${escape(group(g))}</div><p>${s.events.filter(e=>data.catalog[e.id].subject===sub).length} занятий в опубликованном календаре</p><div class="sessions">${ids.map(id=>{const c=data.catalog[id],es=s.events.filter(e=>e.id===id),ds=[...new Set(es.map(e=>fmt(e.date,{weekday:'short'})))].join(', ');return`<div><strong>${ds.toUpperCase()} · ${c.start}–${c.end}</strong><small>${category[c.category]} · ${escape(room(c.location))}</small><small>${escape(c.staff)}</small><small>${es.length===1?short(es[0].date):`${es.length} дат · ${short(es[0].date)} — ${short(es.at(-1).date)}`}${c.note?' · '+escape(c.note):''}</small></div>`}).join('')}</div>${sub==='safety'?'<p>Смешанное занятие «Lecture + Tutorials» включено вместе с практикой.</p>':''}</article>`}).join('')}</div>`;}
 $('schedule').addEventListener('click',e=>{const jump=e.target.closest('[data-jump]');if(jump){week=Number(jump.dataset.jump);render();return}const card=e.target.closest('[data-event]');if(card)showEvent(eventAt({id:card.dataset.event,date:card.dataset.date,group:data.students[person].choices[data.catalog[card.dataset.event].subject]}));});
 function showEvent(e){$('dialog-title').textContent=e.title;$('dialog-content').innerHTML=`<p class="detail-time">${e.start} – ${e.end}</p><p class="detail-date">${escape(fmt(e.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}</p><dl class="detail-grid"><dt>Тип</dt><dd>${category[e.category]}${e.online?' · онлайн':''}</dd><dt>Моя группа</dt><dd><strong>${escape(group(e.group))}</strong></dd><dt>Место</dt><dd>${escape(room(e.location))}</dd><dt>Преподаватель</dt><dd>${escape(e.staff)}</dd>${e.sourceGroups.length>1?`<dt>Совместно</dt><dd>${escape(e.sourceGroups.map(group).join('; '))}</dd>`:''}${e.note?`<dt>Изменение</dt><dd>${escape(e.note)}</dd>`:''}</dl><a class="detail-link" href="${source(e)}" target="_blank" rel="noopener">Это занятие в CELCAT</a>`;$('details').showModal();}
 $('dialog-close').addEventListener('click',()=>$('details').close());
 $('details').addEventListener('click',e=>{if(e.target===$('details')){const r=$('details').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('details').close();}});
 $('audit-open').addEventListener('click',()=>{const s=data.students[person];$('dialog-title').textContent=`О проверке · ${s.name}`;$('dialog-content').innerHTML=`<p>Проверены все 18 недель доступного календаря: 28 сентября 2026 — 31 января 2027.</p><p>${s.events.length} занятий по ${Object.keys(s.choices).length} предметам, 0 пересечений между ними. По каждому подтверждённому предмету выбрана одна постоянная группа.</p>${s.pendingSubjects.length?`<p class="notice"><strong>План предварительный.</strong> ${escape(s.pendingSubjects.join('; '))} не найден в CELCAT. Отсутствие пересечений с ним не подтверждено.</p>`:''}<p>Отдельные лекции исключены.${person==='magzhan'?' Occupational Safety Management оставлен: в CELCAT это «Lecture + Tutorials».':''}</p><p>Это копия на ${escape(fmt(s.checkedAt,{day:'numeric',month:'long',year:'numeric'}))}. Расписание может измениться; сверяйте обновления по ссылке CELCAT. Занятия и экзамены за пределами доступного периода не проверены.</p>`;$('details').showModal();});
 render();
})();
