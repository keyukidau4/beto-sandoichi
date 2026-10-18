import { useCallback } from "react";
import { useAppDispatch } from "./index";
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  addNotification,
  removeNotification,
  clearAllNotifications,
} from "../store/notificationSlice";
import type { Notification } from "../types";

export const useNotification = () => {
  const dispatch = useAppDispatch();

  const success = useCallback(
    (message: string) => {
      dispatch(showSuccess(message));
    },
    [dispatch]
  );

  const error = useCallback(
    (message: string) => {
      dispatch(showError(message));
    },
    [dispatch]
  );

  const warning = useCallback(
    (message: string) => {
      dispatch(showWarning(message));
    },
    [dispatch]
  );

  const info = useCallback(
    (message: string) => {
      dispatch(showInfo(message));
    },
    [dispatch]
  );

  const custom = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      dispatch(addNotification(notification));
    },
    [dispatch]
  );

  const remove = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  const clearAll = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  return {
    success,
    error,
    warning,
    info,
    custom,
    remove,
    clearAll,
  };
};
