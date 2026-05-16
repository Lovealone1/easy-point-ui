import { toast as sonnerToast } from 'sonner';
import { BackendApiError } from '@/shared/utils/api-error';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ToastOptions {
  description?: string;
  duration?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Global toast notification utility.
 * Wraps Sonner to provide standardized success, error, info, and warning toasts,
 * specifically handling custom BackendApiError mapping.
 */
export const toast = {
  /**
   * Displays a success notification.
   */
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Displays an informational notification.
   */
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  /**
   * Displays a warning notification.
   */
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    });
  },

  /**
   * Displays an error notification.
   * If the error is an instance of BackendApiError, it automatically maps
   * the status code and server message to a user-friendly format.
   */
  error: (errorOrMessage: string | Error | BackendApiError, options?: ToastOptions) => {
    let title = 'Ha ocurrido un error';
    let description = options?.description;

    if (typeof errorOrMessage === 'string') {
      title = errorOrMessage;
    } else if (errorOrMessage instanceof BackendApiError) {
      // Automatic mapping for our standard BFF errors
      title = errorOrMessage.message || 'Error en el servidor';
      
      // We can map specific status codes if needed
      if (errorOrMessage.statusCode === 403) {
        title = 'Acceso denegado';
        description = 'No tienes permisos para realizar esta acción.';
      } else if (errorOrMessage.statusCode === 401) {
        title = 'Sesión expirada';
        description = 'Por favor, inicia sesión nuevamente.';
      } else if (Array.isArray(errorOrMessage.details) && errorOrMessage.details.length > 0) {
        // Si hay errores de validación (NestJS class-validator), `details` es un array.
        title = errorOrMessage.errorType || 'Error de validación';
        description = errorOrMessage.details.join(', ');
      } else if (errorOrMessage.details && typeof errorOrMessage.details === 'string' && errorOrMessage.details !== title) {
        description = errorOrMessage.details;
      }
    } else if (errorOrMessage instanceof Error) {
      title = errorOrMessage.message;
    }

    sonnerToast.error(title, {
      description,
      duration: options?.duration ?? 5000,
    });
  },

  /**
   * Displays a loading toast that must be dismissed manually or by a promise.
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    });
  },

  /**
   * Dismisses a specific toast by ID, or all toasts if no ID is provided.
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
