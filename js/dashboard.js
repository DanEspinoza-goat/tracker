export const queueSummary = requests => ({ active:requests.length, critical:requests.filter(r=>r.priority==='Critical').length });
