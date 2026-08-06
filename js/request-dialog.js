import { escapeHtml, formatDate } from './utils.js';

const employeeDirectory = { '1234': { requester:'Aatish Kumar', designation:'Associate', region:'Asia-Pacific', business:'Markets', email:'aatish@example.com', gocCode:'GOC-1234' } };
const types = ['Company Research','Industry Research','Market Research','Deal Research','Adverse News','Quick Request'];
const quickDeadlines = [[120,'In the next 2 hours'],[180,'In the next 3 hours'],[240,'In the next 4 hours'],[360,'In the next 6 hours'],[480,'In the next 8 hours'],[600,'In the next 10 hours'],[720,'In the next 12 hours']];
const quickDeadlineField = () => `<label>Quick deadline<select name="quickDeadline"><option value="">Select a deadline</option>${quickDeadlines.map(([minutes,label]) => `<option value="${minutes}">${label}</option>`).join('')}</select></label>`;
const localDateTime = date => { const offset = date.getTimezoneOffset() * 60000; return new Date(date - offset).toISOString().slice(0,16); };

function bindQuickDeadline(form, apply) {
  form.elements.quickDeadline.onchange = () => { const minutes = Number(form.elements.quickDeadline.value); if (minutes) apply(new Date(Date.now() + minutes * 60000)); };
}

export function showNewRequestDialog(onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `<section class="modal request-modal" role="dialog" aria-modal="true"><div class="modal-header">Submit New Request</div><form class="modal-body" data-new-request><div class="form-grid"><label>Employee ID<input name="employeeId" placeholder="e.g. 1234" autofocus></label><label>GOC<input name="gocCode" value="1234567"></label><label>SOEID<input name="soeid" value="AV38316"></label><label>Deal Number<input name="dealNumber" placeholder="*45R0059"></label><label>Requester Name<input name="requester" required></label><label>Email<input name="email" type="email" required></label><label>Designation<input name="designation"></label><label>Region<select name="region"><option>Americas</option><option>Asia-Pacific</option><option>Europe</option></select></label><label>Business<input name="business"></label><label>Company<input name="company" required></label><label>Request Type<select name="type">${types.map(type => `<option>${type}</option>`).join('')}</select></label><label>ETA (minutes)<input name="eta" type="number" min="1" value="60"></label><label>Deadline<input name="deadline" type="datetime-local" required></label>${quickDeadlineField()}</div><label class="form-full">Request details<textarea name="description" required placeholder="Describe the research or information required..."></textarea></label><div class="modal-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Submit Request</button></div></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-new-request]');
  form.employeeId.oninput = () => { const profile = employeeDirectory[form.employeeId.value.trim()]; if (!profile) return; Object.entries(profile).forEach(([key,value]) => { if (form.elements[key]) form.elements[key].value = value; }); };
  bindQuickDeadline(form, date => { form.elements.deadline.value = localDateTime(date); });
  modal.querySelector('[data-close]').onclick = () => modal.remove();
  form.onsubmit = event => { event.preventDefault(); const data = Object.fromEntries(new FormData(form)); modal.remove(); onSubmit(data); };
}

export function showEditableQueueRequest(request, onSave) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  const fields = ['requester','designation','region','business','company','type','eta'];
  const deadline = new Date(request.deadline);
  modal.innerHTML = `<section class="modal request-modal" role="dialog" aria-modal="true"><div class="modal-header">Edit Request ${escapeHtml(request.id)}</div><form class="modal-body" data-edit-request><div class="form-grid">${fields.map(key => `<label>${key.replace(/([A-Z])/g,' $1')}<input name="${key}" value="${escapeHtml(request[key] ?? '')}"></label>`).join('')}<label>Deadline date<input type="date" name="deadlineDate" value="${deadline.toISOString().slice(0,10)}"></label><label>Deadline time (24 hour)<input type="time" name="deadlineTime" value="${deadline.toISOString().slice(11,16)}"></label>${quickDeadlineField()}</div><label class="form-full">Request details<textarea name="description">${escapeHtml(request.description || '')}</textarea></label><div class="modal-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save Changes</button></div></form></section>`;
  document.body.append(modal);
  const form = modal.querySelector('[data-edit-request]');
  bindQuickDeadline(form, date => { form.elements.deadlineDate.value = localDateTime(date).slice(0,10); form.elements.deadlineTime.value = localDateTime(date).slice(11,16); });
  modal.querySelector('[data-close]').onclick = () => modal.remove();
  form.onsubmit = event => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); const { deadlineDate, deadlineTime, quickDeadline, ...updated } = values; Object.assign(request, updated, { eta:Number(updated.eta), deadline:new Date(`${deadlineDate}T${deadlineTime}:00`).toISOString() }); request.audit.push({ action:'Request details edited', at:new Date().toISOString() }); modal.remove(); onSave(); };
}

export function showRequestDialog(request, onUpdate) {
  const modal = document.createElement('div'); modal.className = 'modal-backdrop';
  const pages = [['details','Request Details'],['comments','Comments'],['audit','Audit Trail']];
  modal.innerHTML = `<section class="modal request-modal request-view" role="dialog" aria-modal="true"><div class="modal-header">Request ${escapeHtml(request.id)} <button class="modal-close" data-close>×</button></div><div class="request-tabs">${pages.map(([id,label],index) => `<button data-page="${id}" class="${index === 0 ? 'active' : ''}">${label}</button>`).join('')}</div><div class="modal-body" data-page-content></div><div class="modal-actions"><button data-email>Compose email</button><button data-close>Close</button></div></section>`;
  document.body.append(modal);
  const content = modal.querySelector('[data-page-content]');
  const renderPage = id => { const output = {
    details:`<dl class="detail-list">${[['Requester',request.requester],['Employee ID',request.employeeId || '—'],['SOEID',request.soeid || '—'],['GOC',request.gocCode || '—'],['Deal Number',request.dealNumber || '—'],['Email',request.email || '—'],['Designation',request.designation],['Region',request.region],['Business',request.business],['Company',request.company],['Request Type',request.type],['Deadline',formatDate(request.deadline)],['ETA',`${request.eta} mins`]].map(([key,value]) => `<div class="detail-row"><dt>${key}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><label class="form-full">Request details<textarea readonly>${escapeHtml(request.description)}</textarea></label>`,
    comments:`<div class="comments">${request.comments?.length ? request.comments.map(comment => `<article class="comment">${escapeHtml(comment.text)}<div class="comment-meta">${escapeHtml(comment.author)} · ${formatDate(comment.at)}</div></article>`).join('') : '<div class="comment">No comments added.</div>'}</div><textarea class="comment-input" data-dialog-comment placeholder="Add an editable comment..."></textarea><button data-save-dialog-comment>Add Comment</button>`,
    audit:`<ol class="audit-list">${[...(request.audit || [])].reverse().map(item => `<li class="audit-item">${escapeHtml(item.action)}<time class="audit-at">${formatDate(item.at)}</time></li>`).join('')}</ol>`
  }; content.innerHTML = output[id]; };
  renderPage('details');
  modal.querySelectorAll('[data-page]').forEach(button => button.onclick = () => { modal.querySelectorAll('[data-page]').forEach(item => item.classList.toggle('active', item === button)); renderPage(button.dataset.page); });
  modal.querySelectorAll('[data-close]').forEach(button => button.onclick = () => modal.remove());
  modal.querySelector('[data-email]').onclick = () => showEmailDialog(request, onUpdate);
}

export function showEmailDialog(request, onUpdate) {
  const modal = document.createElement('div'); modal.className = 'modal-backdrop';
  const to = request.email || ''; const cc = [request.cc,'mumbai.library'].filter(Boolean).join(',');
  modal.innerHTML = `<section class="modal request-modal" role="dialog" aria-modal="true"><div class="modal-header">Email <button class="modal-close" data-close>×</button></div><div class="request-tabs"><button class="active" data-email-page="new">New Email</button><button data-email-page="trail">Email Trail</button></div><div class="modal-body" data-email-content></div></section>`;
  document.body.append(modal); const content = modal.querySelector('[data-email-content]');
  const render = page => { content.innerHTML = page === 'new' ? `<form data-compose><div class="email-fields"><label>To<input name="to" value="${escapeHtml(to)}"></label><label>CC<input name="cc" value="${escapeHtml(cc)}"></label><label>BCC<input name="bcc"></label><label>Subject<input name="subject" value="Information Request ${escapeHtml(request.id)} – ${escapeHtml(request.company || request.type)}"></label><label>Body<textarea name="body" placeholder="Paste your output or write the delivery message..."></textarea></label></div><div class="modal-actions"><button type="button" data-close>Discard</button><button class="primary" type="submit">Send</button></div></form>` : `<div class="comments">${request.emails?.length ? request.emails.slice().reverse().map(email => `<article class="comment"><strong>${escapeHtml(email.subject)}</strong><div>${escapeHtml(email.to)}</div><div class="comment-meta">${formatDate(email.at)}</div></article>`).join('') : '<div class="comment">No emails recorded for this request.</div>'}</div>`; if (page === 'new') content.querySelector('[data-compose]').onsubmit = event => { event.preventDefault(); const email = Object.fromEntries(new FormData(event.currentTarget)); request.emails ||= []; request.emails.push({ ...email, at:new Date().toISOString() }); request.audit.push({ action:`Email prepared for ${email.to}`, at:new Date().toISOString() }); onUpdate?.(); modal.remove(); }; content.querySelectorAll('[data-close]').forEach(button => button.onclick = () => modal.remove()); };
  render('new'); modal.querySelectorAll('[data-email-page]').forEach(button => button.onclick = () => { modal.querySelectorAll('[data-email-page]').forEach(item => item.classList.toggle('active', item === button)); render(button.dataset.emailPage); }); modal.querySelectorAll('[data-close]').forEach(button => button.onclick = () => modal.remove());
}
