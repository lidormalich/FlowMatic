import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-500 p-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                className="h-8 w-auto mr-2"
                src="/path/to/your/logo.png"
                alt="Logo"
              />
              <span className="text-white text-xl font-bold">Your Company</span>
            </Link>
          </div>
          <div className="block lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
          <div className="hidden lg:flex lg:items-center lg:w-auto">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <div className="relative">
                <button
                  onClick={() => toggleMenu()}
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Services
                </button>
                {isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg z-20">
                    <Link
                      to="/service1"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                    >
                      Service 1
                    </Link>
                    <Link
                      to="/service2"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                    >
                      Service 2
                    </Link>
                  </div>
                )}
              </div>
              <Link
                to="/about"
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`lg:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            About
          </Link>
          <div className="relative">
            <button
              onClick={() => toggleMenu()}
              className="text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
            >
              Services
            </button>
            {isOpen && (
              <div className="absolute top-0 left-0 mt-0 w-full bg-white rounded-lg shadow-lg z-20">
                <Link
                  to="/service1"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Service 1
                </Link>
                <Link
                  to="/service2"
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                >
                  Service 2
                </Link>
              </div>
            )}
          </div>
          <Link
            to="/contact"
            className="text-white block px-3 py-2 rounded-md text-base font-medium"
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
