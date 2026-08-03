export function toggleSort(sort, key) { return { key, direction: sort.key === key && sort.direction === 'asc' ? 'desc' : 'asc' }; }
