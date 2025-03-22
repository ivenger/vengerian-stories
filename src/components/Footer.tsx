
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 py-8 border-t border-gray-200">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© {currentYear} Minimal Writing. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
