import { createInitialQueue } from './data.js';
const KEY = 'irt.queue.v1';
export function loadState() { try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.queue?.length) return { ...saved, myRequests:saved.myRequests || [], archive:saved.archive || [], productionByResearcher:saved.productionByResearcher || {}, currentQcer:saved.currentQcer || 'Aatish', currentResearcher:saved.currentResearcher || 'Alan' }; } catch { /* fall through */ } const queue = createInitialQueue(); return { queue, myRequests:[], archive:[], nextId:300001, productionByResearcher:{}, currentQcer:'Aatish', currentResearcher:'Alan' }; }
export const saveState = state => localStorage.setItem(KEY, JSON.stringify(state));
