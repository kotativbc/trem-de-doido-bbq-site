const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="text-xs text-red-400" role="alert">
      {message}
    </p>
  ) : null;

export default FieldError;
