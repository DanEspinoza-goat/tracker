export const capacityFor = requests => requests.reduce((total, request) => total + request.eta, 0);
