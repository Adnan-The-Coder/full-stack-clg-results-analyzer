"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

import { ModeToggle } from "./ModeToggle"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white shadow-md dark:bg-gray-900">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-bold text-gray-800 dark:text-white">
          MyProject
        </Link>
        {/* Desktop Nav */}
        <nav className="hidden items-center space-x-6 md:flex">
          <Link href="/" className="text-gray-700 hover:underline dark:text-gray-200">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 hover:underline dark:text-gray-200">
            About
          </Link>
          <Link href="/contact" className="text-gray-700 hover:underline dark:text-gray-200">
            Contact
          </Link>
          <ModeToggle />
        </nav>
        {/* Mobile Right Controls (Toggle + Hamburger) */}
        <div className="flex items-center space-x-3 md:hidden">
          <ModeToggle />
          <button
            className="text-gray-800 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="bg-white px-4 pb-4 dark:bg-gray-900 md:hidden">
          <nav className="flex flex-col space-y-2">
            <Link href="/" className="text-gray-700 hover:underline dark:text-gray-200">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:underline dark:text-gray-200">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:underline dark:text-gray-200">
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
