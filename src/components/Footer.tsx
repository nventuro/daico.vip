export default function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex gap-4 text-xs text-muted">
        <a href="/privacy/" className="underline transition-colors hover:text-muted-strong">
          Política de Privacidad
        </a>
        <a href="/terms/" className="underline transition-colors hover:text-muted-strong">
          Términos de Servicio
        </a>
      </div>
      <p className="text-xs text-muted">Hecho con 💚</p>
    </footer>
  );
}
