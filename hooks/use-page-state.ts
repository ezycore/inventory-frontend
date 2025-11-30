import { useState, useEffect, useRef } from "react";

export interface UsePageStateOptions {
 defaultLimit?: number;
}

export function usePageState<T = any>(options: UsePageStateOptions = {}) {
 const { defaultLimit = 10 } = options;

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingItem, setEditingItem] = useState<T | null>(null);
 const [isViewMode, setIsViewMode] = useState(false);
 const [page, setPage] = useState(1);
 const [limit, setLimit] = useState(defaultLimit);

 // Track if component is mounted to prevent state updates during render
 const isMountedRef = useRef(false);
 useEffect(() => {
  isMountedRef.current = true;
  return () => {
   isMountedRef.current = false;
  };
 }, []);

 return {
  modal: { isOpen: isModalOpen, setIsOpen: setIsModalOpen },
  editing: { item: editingItem, setItem: setEditingItem },
  view: { isViewMode, setIsViewMode },
  pagination: { page, setPage, limit, setLimit },
  isMountedRef,
 };
}
