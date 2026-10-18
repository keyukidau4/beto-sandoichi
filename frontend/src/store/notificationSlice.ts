import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Notification, NotificationState } from "../types";

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substring(2, 11);

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id" | "timestamp">>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: generateId(),
        timestamp: Date.now(),
        duration: action.payload.duration || 5000, // Default 5 seconds
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    showSuccess: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: generateId(),
        type: "success",
        message: action.payload,
        duration: 5000,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    showError: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: generateId(),
        type: "error",
        message: action.payload,
        duration: 7000, // Errors stay longer
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    showWarning: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: generateId(),
        type: "warning",
        message: action.payload,
        duration: 6000,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    showInfo: (state, action: PayloadAction<string>) => {
      const notification: Notification = {
        id: generateId(),
        type: "info",
        message: action.payload,
        duration: 4000,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
  },
});

export const {
  addNotification,
  removeNotification,
  clearAllNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} = notificationSlice.actions;

export default notificationSlice.reducer;
