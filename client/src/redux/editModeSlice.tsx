import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface EditModeState {
  isEditMode: boolean;
}

const initialState: EditModeState = {
  isEditMode: false,
};

const editModeSlice = createSlice({
  name: 'editMode',
  initialState,
  reducers: {
    toggleEditMode: (state) => {
      state.isEditMode = !state.isEditMode;
    },
    setEditMode: (state, action: { payload: boolean }) => {
      state.isEditMode = action.payload;
    },
    exitEditMode: (state) => {
      state.isEditMode = false;
    },
  },
});

export const { toggleEditMode, setEditMode, exitEditMode } = editModeSlice.actions;

export const selectIsEditMode = (state: RootState) => state.editMode.isEditMode;

export const editModeReducer = editModeSlice.reducer;
