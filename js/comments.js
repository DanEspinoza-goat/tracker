export function addComment(request, text, author) { request.comments.push({ text, author, at:new Date().toISOString() }); }
