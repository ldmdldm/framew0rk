import React from 'react';
import { Terminal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectWallet } from './ConnectWallet';

export function Header() {
  const location = useLocation();

  return (
    <header className="bg-[#0A0A0A] border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center space-x-4">
            <Terminal className="w-8 h-8 text-emerald-500" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Framew0rk
            </h1>
          </Link>
          <div className="flex items-center gap-12">
            <nav>
              <ul className="flex space-x-8">
                <li>
                  <Link
                    to="/"
                    className={`transition-colors font-medium ${
                      location.pathname === '/'
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    User
                  </Link>
                </li>
                <li>
                  <Link
                    to="/portfolio"
                    className={`transition-colors font-medium ${
                      location.pathname === '/portfolio'
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    to="/protocols"
                    className={`transition-colors font-medium ${
                      location.pathname === '/protocols'
                        ? 'text-emerald-400'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    Protocols
                  </Link>
                </li>
              </ul>
            </nav>
            <ConnectWallet />
          </div>
        </div>
      </div>
    </header>
  );
}