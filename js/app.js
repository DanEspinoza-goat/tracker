import { loadState, saveState } from './storage.js';
import { renderShell, showQcReviewDialog, initialiseClocks } from './ui.js';
import { renderQueue, filteredRequests } from './queue.js';
import { defaultFilters } from './filters.js';
import { toggleSort } from './sorting.js';
import { changePage } from './pagination.js';
import { createRequest } from './data.js';
import { appendAudit } from './audit.js';
import { addComment } from './comments.js';
import { renderMyRequests, renderWorkspace } from './workspace.js';
import { renderMyRequestsV2 } from './myrequests-v2.js';
import { renderCapacity } from './capacity-view.js';
import { renderArchive } from './archive.js';
import { assignToResearcher, startWork, pauseWork, currentWorkMinutes, recordProduction, moveToArchive } from './workflow.js';
import { renderQcWorklist } from './qc.js';
import { showNewRequestDialog, showRequestDialog, showEditableQueueRequest } from './request-dialog.js';

const state = loadState();
const view = { page:1, pageSize:20, search:'', filters:defaultFilters(), sort:{key:'id',direction:'asc'} };
let screen = 'queue';
let activeRequestId = null;
const app = document.querySelector('#app');
function render() { const content = screen === 'queue' ? renderQueue(state, view) : screen === 'myRequests' ? renderMyRequestsV2(state) : screen === 'currentCapacity' ? renderCapacity(state) : screen === 'archive' ? renderArchive(state) : screen === 'qc' ? renderQcWorklist(state) : renderWorkspace(state.myRequests.find(r=>r.id===activeRequestId)); app.innerHTML = renderShell(content, state, screen); bind(); initialiseClocks(); }
function bind() {
  app.querySelectorAll('[data-screen]').forEach(el => el.onclick=()=>{ screen=el.dataset.screen; render(); });
  app.querySelector('[data-current-qcer]').onchange = event => { state.currentQcer=event.target.value.trim() || 'Aatish'; saveState(state); render(); };
  app.querySelectorAll('[data-open-queue]').forEach(el=>el.onclick=()=>{ screen='queue'; render(); });
  app.querySelectorAll('[data-back-myrequests]').forEach(el=>el.onclick=()=>{ screen='myRequests'; render(); });
  app.querySelectorAll('[data-open-workspace]').forEach(el=>el.onclick=()=>{ activeRequestId=Number(el.dataset.openWorkspace); screen='workspace'; render(); });
  app.querySelectorAll('[data-open-request]').forEach(el=>el.onclick=()=>{ const request=findRequest(el.dataset.openRequest); if (!request) return; const save=()=>{ saveState(state); render(); }; state.queue.includes(request) ? showEditableQueueRequest(request,save) : showRequestDialog(request,save); });
  app.querySelectorAll('[data-expand-request]').forEach(el=>el.onclick=event=>{ event.stopPropagation(); state.expandedRequest=state.expandedRequest===Number(el.dataset.expandRequest)?null:Number(el.dataset.expandRequest); render(); });
  app.querySelectorAll('[data-row-play]').forEach(el=>el.onclick=()=>{ const request=findMyRequest(Number(el.dataset.rowPlay)); const active=state.myRequests.find(item=>item.timerStartedAt && item.id!==request.id); if (active && !confirm(`Start ${request.id}? This will pause ${active.id}.`)) return; if (active) pauseWork(active); startWork(request); saveState(state); render(); });
  app.querySelectorAll('[data-row-pause]').forEach(el=>el.onclick=()=>{ const request=findMyRequest(Number(el.dataset.rowPause)); pauseWork(request); saveState(state); render(); });
  app.querySelectorAll('[data-complete-request]').forEach(el=>el.onclick=()=>{ if (confirm(`Send output and complete ${el.dataset.completeRequest}?`)) finaliseDelivery(Number(el.dataset.completeRequest)); });
  app.querySelectorAll('[data-finish-production]').forEach(el=>el.onclick=()=>finishProduction(Number(el.dataset.finishProduction)));
  app.querySelectorAll('[data-open-qc]').forEach(el=>el.onclick=()=>openQcReview(Number(el.dataset.openQc)));
  app.querySelectorAll('[data-restore]').forEach(el=>el.onclick=()=>restoreRequest(Number(el.dataset.restore)));
  if (screen === 'queue') bindQueue();
  if (screen === 'workspace') bindWorkspace();
  app.querySelectorAll('[data-unavailable]').forEach(el=>el.onclick=()=>alert(`${el.textContent} is visible for navigation consistency and will be configured in the next screen pass.`));
}
function bindQueue() {
  app.querySelector('.page-size').onchange = event => { view.pageSize=event.target.value; view.page=1; render(); };
  app.querySelector('#queue-search').oninput = event => { view.search=event.target.value; view.page=1; render(); };
  app.querySelectorAll('[data-filter]').forEach(el => el.onchange = event => { view.filters[event.target.dataset.filter]=event.target.value; view.page=1; render(); });
  app.querySelector('[data-clear-filters]').onclick = () => { view.filters=defaultFilters(); view.search=''; view.page=1; render(); };
  app.querySelectorAll('[data-sort]').forEach(el => el.onclick=()=>{ const key=el.dataset.sort; if (!['expand','attachments','mail','assign','project','urgent','actions'].includes(key)) { view.sort=toggleSort(view.sort,key); render(); } });
  app.querySelectorAll('[data-page]').forEach(el=>el.onclick=()=>{ const count=filteredRequests(state.queue,view).length; view.page=changePage(view,el.dataset.page,Math.max(1,Math.ceil(count/view.pageSize))); render(); });
  app.querySelectorAll('[data-assign]').forEach(el=>el.onclick=event=>{ event.stopPropagation(); confirmAssignment(Number(el.dataset.assign)); });
  app.querySelector('.new-request').onclick=()=>showNewRequestDialog(createNewRequest);
  app.querySelectorAll('[data-request-action]').forEach(el=>el.onclick=event=>{ event.stopPropagation(); handleRequestAction(el.dataset.requestAction,el.dataset.requestId); });
}
function bindWorkspace() {
  app.querySelector('[data-add-comment]').onclick = event => { const input=app.querySelector('[data-comment-input]'); const text=input.value.trim(); if (!text) return; const request=findMyRequest(Number(event.target.dataset.addComment)); addComment(request,text,'Current Staffer'); appendAudit(request,'Comment added by Current Staffer'); saveState(state); render(); };
  app.querySelector('[data-add-attachment]').onclick = event => { const request=findMyRequest(Number(event.target.dataset.addAttachment)); request.attachments.push({ name:'Attachment record', addedBy:'Current Staffer', at:new Date().toISOString() }); appendAudit(request,'Attachment record added by Current Staffer'); saveState(state); render(); };
  app.querySelectorAll('[data-start-work]').forEach(el=>el.onclick=()=>{ const request=findMyRequest(Number(el.dataset.startWork)); startWork(request); saveState(state); render(); });
  app.querySelectorAll('[data-pause-work]').forEach(el=>el.onclick=()=>{ const request=findMyRequest(Number(el.dataset.pauseWork)); syncWorkMinutes(request); pauseWork(request); saveState(state); render(); });
  app.querySelectorAll('[data-submit-research]').forEach(el=>el.onclick=()=>completeResearch(Number(el.dataset.submitResearch)));
  app.querySelectorAll('[data-final-delivery]').forEach(el=>el.onclick=()=>finaliseDelivery(Number(el.dataset.finalDelivery)));
}
const findMyRequest = id => state.myRequests.find(request => request.id === id);
const findRequest = id => [...state.queue,...state.myRequests,...state.archive].find(request => String(request.id) === String(id));
function createNewRequest(values) { const request=createRequest(state.nextId++); Object.assign(request,{ id:`REQ${request.id}`, submitted:new Date().toISOString(), requester:values.requester, employeeId:values.employeeId, gocCode:values.gocCode, email:values.email, designation:values.designation, region:values.region, business:values.business, company:values.company, type:values.type, eta:Number(values.eta), deadline:new Date(values.deadline).toISOString(), priority:values.priority, description:values.description, cc:'mumbai.library' }); appendAudit(request,`Request submitted by ${request.requester} (Employee ID: ${request.employeeId || 'not provided'})`); state.queue.unshift(request); saveState(state); render(); }
function nextRelatedId(id) { const text=String(id); return text.replace(/(\d+)$/, digits => String(Number(digits)+1).padStart(digits.length,'0')); }
function handleRequestAction(action,id) { const request=state.queue.find(item=>String(item.id)===String(id)); if (!request) return; if (action==='add') { const copy={ ...request, id:nextRelatedId(request.id), submitted:new Date().toISOString(), status:'New', audit:[{ action:`Related request created from ${request.id}`, at:new Date().toISOString() }], comments:[], attachments:[] }; state.queue.unshift(copy); } if (action==='hold') { request.status='On Hold'; appendAudit(request,'Request placed on hold'); state.queue=state.queue.filter(item=>item!==request); (state.onHold ||= []).unshift(request); } if (action==='cancel') { request.status='Cancelled'; request.archivedAt=new Date().toISOString(); appendAudit(request,'Request cancelled'); state.queue=state.queue.filter(item=>item!==request); state.archive.unshift(request); } saveState(state); render(); }
function syncWorkMinutes(request) { const input=app.querySelector('[data-work-minutes]'); if (input) request.workMinutes=Math.max(0,Number(input.value) || 0); }
function completeResearch(id) { const request=findMyRequest(id); syncWorkMinutes(request); request.timerStartedAt=null; recordProduction(state,request); if (request.requiresQC) { request.status='Pending QC'; request.workflowStage='qc'; appendAudit(request,`Research completed and routed to ${request.qc} for QC review`); } else { request.status='Completed'; moveToArchive(state,request,'Production-only request completed and archived'); screen='archive'; } saveState(state); render(); }
function finishProduction(id) { const request=findMyRequest(id); if (!confirm(`Finish production for ${request.id} and send it to QC?`)) return; pauseWork(request); request.requiresQC=true; completeResearch(id); }
function openQcReview(id) { const request=findMyRequest(id); if (!request) return; showQcReviewDialog(request, review=>processQcDecision(id,review)); }
function processQcDecision(id, review) { const request=findMyRequest(id); request.qcRating=review.rating || request.qcRating || 'Satisfactory'; if (review.comment) addComment(request,review.comment,`QC · ${request.qc}`); const labels={approve:'Approved by QC; returned to researcher for banker delivery',rework:'QC returned request for rework',hold:'QC review placed on hold',escalate:'QC escalated request to Staffer / Manager'}; if (review.decision==='approve') { request.status='Awaiting Delivery'; request.workflowStage='delivery'; } if (review.decision==='rework') { request.status='In Progress'; request.workflowStage='production'; } if (review.decision==='hold') request.status='Paused'; if (review.decision==='escalate') request.status='On Hold'; appendAudit(request,`${labels[review.decision]} · ${request.qcRating}`); saveState(state); render(); }
function finaliseDelivery(id) { const request=findMyRequest(id); syncWorkMinutes(request); recordProduction(state,request); request.status='Completed'; moveToArchive(state,request,'Final delivery confirmed by researcher; request completed and archived'); screen='archive'; saveState(state); render(); }
function restoreRequest(id) { const request=state.archive.find(item=>item.id===id); if (!request) return; request.status='Assigned'; delete request.archivedAt; appendAudit(request,'Restored from Archive'); state.archive=state.archive.filter(item=>item.id!==id); state.myRequests.unshift(request); saveState(state); screen='myRequests'; render(); }
function confirmAssignment(id) { const request=state.queue.find(r=>r.id===id); if (!request) return; assignToResearcher(request,state.currentResearcher,state.currentQcer); state.queue=state.queue.filter(item=>item.id!==id); state.myRequests.unshift(request); state.queue.push(createRequest(state.nextId++)); saveState(state); render(); }
render();
window.setInterval(() => { if (screen === 'myRequests' && state.myRequests.some(request => request.timerStartedAt)) render(); }, 60000);
