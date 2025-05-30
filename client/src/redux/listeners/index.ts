import { createListenerMiddleware, addListener } from '@reduxjs/toolkit';
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '../store';
import orderAddedListener from './orderAddedListener';
import cartUpdateListener from './cartUpdateListener';

const listenerMiddleware = createListenerMiddleware<RootState>();
export default listenerMiddleware;

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
export const startAppListening = listenerMiddleware.startListening as AppStartListening;
export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

orderAddedListener(startAppListening);
cartUpdateListener(startAppListening);
