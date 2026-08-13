import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LayoutState = {
  /** Rail colapsada no desktop. */
  sidebarCollapsed: boolean;
  /** Drawer da sidebar no mobile. */
  mobileNavOpen: boolean;
};

const initialState: LayoutState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    sidebarToggled: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    sidebarCollapsedChanged: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    mobileNavToggled: (state) => {
      state.mobileNavOpen = !state.mobileNavOpen;
    },
    mobileNavClosed: (state) => {
      state.mobileNavOpen = false;
    },
  },
  selectors: {
    selectSidebarCollapsed: (state) => state.sidebarCollapsed,
    selectMobileNavOpen: (state) => state.mobileNavOpen,
  },
});

export const {
  sidebarToggled,
  sidebarCollapsedChanged,
  mobileNavToggled,
  mobileNavClosed,
} = layoutSlice.actions;
export const { selectSidebarCollapsed, selectMobileNavOpen } =
  layoutSlice.selectors;

export default layoutSlice.reducer;
