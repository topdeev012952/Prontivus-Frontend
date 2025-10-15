import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if key is undefined (e.g., some special keys)
      if (!e.key) return;
      
      shortcuts.forEach(({ key, ctrl, action }) => {
        const ctrlMatch = ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch) {
          e.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const useGlobalShortcuts = () => {
  // Keyboard shortcuts completely disabled to prevent accidental navigation
  // when typing in forms, especially in consultation notes (Anamnese, etc.)
  // Previously: 'n' navigated to /patients, 'a' navigated to /appointments
  // These caused issues when doctors were typing medical notes
  
  // No shortcuts registered - function is now a no-op
  return;
};
