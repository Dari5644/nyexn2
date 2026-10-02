import { AsyncLocalStorage } from 'async_hooks';
export const actorStore = new AsyncLocalStorage();
export const getActor = () => actorStore.getStore() || { name: 'system', role: 'system' };
