"use client";

type WhatsAppLinkProps = {
  children: React.ReactNode;
  className?: string;
  mensagem?: string;
};

export default function WhatsAppLink({
  children,
  className,
  mensagem,
}: WhatsAppLinkProps) {
  function handleClick() {
    const gtag = (window as any).gtag;

    if (gtag) {
      gtag("event", "whatsapp_click", {
        event_category: "Contato",
        event_label: "WhatsApp",
      });
    }
  }

  return (
    <a
      href={mensagem
  ? `https://api.whatsapp.com/send?phone=5567996910734&text=${encodeURIComponent(mensagem)}`
  : "https://wa.me/message/GSDJGPZA2QRKA1"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}>
      {children}
    </a>
  );
}