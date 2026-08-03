import { researchers } from './data.js';
import { currentWorkMinutes } from './workflow.js';

const DAILY_CAPACITY = 480;
export function renderCapacity(state) {
  const rows = ['Current Staffer', ...researchers].map(name => {
    const assigned = state.myRequests.filter(request => request.researcher === name);
    const current = assigned.find(request => request.workflowStage === 'production' || request.workflowStage === 'delivery');
    const activeMinutes = current ? currentWorkMinutes(current) : 0;
    const minutes = (state.productionByResearcher?.[name] || 0) + (current?.productionRecorded ? 0 : activeMinutes);
    const percent = Math.min(100, Math.round((minutes / DAILY_CAPACITY) * 100));
    const availability = percent >= 90 ? 'Unavailable' : percent >= 70 ? 'Limited' : 'Available';
    return { name, current, minutes, percent, availability };
  });
  return `<section><div class="capacity-header"><div><h2>Current Capacity</h2><div class="capacity-note">Live allocation view</div></div><button class="back-queue" data-open-queue>Back to Queue</button></div><div class="capacity-table-wrap"><table class="capacity-table"><thead><tr><th>Researcher</th><th>Current<br>Request</th><th>Request Type</th><th>Time Spent</th><th>ETA Remaining</th><th>Availability</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${row.name}</td><td>${row.current?.id ?? '—'}</td><td>${row.current?.type ?? '—'}</td><td>${row.current ? '0 mins' : '—'}</td><td>${row.current ? `${row.current.eta} mins` : '—'}</td><td class="availability ${row.availability.toLowerCase()}">${row.availability}</td></tr>`).join('')}</tbody></table></div></section>`;
}
