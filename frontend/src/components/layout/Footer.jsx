import React from 'react';

const Footer = ({ fixed = false }) => {
  return (
    <footer className={`${fixed ? 'fixed bottom-0 left-0 w-full' : 'w-full mt-8'} border-t border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60`}>
      <div className="container px-4 md:px-6 py-4 text-center text-slate-600 text-sm">
        <span>
          Desarrollado por{' '}
          <a
            href="https://wa.me/5493704602028"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            title="Contactar a Iván García por WhatsApp"
          >
            Iván García
          </a>{' '}
          para <strong>Wea#dev</strong> - Formosa Argentina.
        </span>
      </div>
    </footer>
  );
};

export default Footer;