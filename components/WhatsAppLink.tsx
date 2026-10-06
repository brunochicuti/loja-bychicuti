"use client";

type WhatsAppLinkProps = {
  children: React.ReactNode;
  className?: string;
};

export default function WhatsAppLink({
  children,
  className,
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
      href="https://wa.me/message/GSDJGPZA2QRKA1"
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}