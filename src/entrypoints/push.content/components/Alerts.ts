import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Blocking replacement for native alert(). Execution pauses until the user
 * dismisses the modal (same as alert() did), it's just no longer a native
 * browser dialog.
 */
export function showErrorAlert(message: string): Promise<unknown> {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonText: 'OK',
  });
}