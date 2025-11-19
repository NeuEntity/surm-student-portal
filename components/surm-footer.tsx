export function SurmFooter() {
  return (
    <footer className="bg-[var(--surm-green)] text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-white">SURM</h3>
            <p className="text-xs sm:text-sm text-white/80 font-sans">
              Sekolah Ugama Radin Mas
            </p>
            <p className="text-xs sm:text-sm text-white/80 mt-2 font-sans">
              Empowering students through Islamic education
            </p>
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-white">Quick Links</h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80 font-sans">
              <li>
                <a href="https://surm.edu.sg" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  School Website
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-serif text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-white">Contact</h3>
            <p className="text-xs sm:text-sm text-white/80 font-sans">
              For support, please contact your teacher or administrator.
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center text-xs sm:text-sm text-white/70 font-sans">
          <p>&copy; {new Date().getFullYear()} SURM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

