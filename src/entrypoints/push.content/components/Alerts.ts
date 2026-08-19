import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export function showErrorAlert(message: string): Promise<unknown> {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonText: 'OK',
  });
}