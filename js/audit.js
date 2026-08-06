export function appendAudit(request, action) { request.audit.push({ action, at:new Date().toISOString() }); }
