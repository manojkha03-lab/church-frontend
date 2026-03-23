import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] bg-white/70 backdrop-blur-md shadow-md rounded-full px-6 py-3 flex justify-between items-center z-50">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          +
        </div>
        <div>
          <h1 className="font-semibold">Sacred Heart Church</h1>
          <p className="text-xs text-gray-500">FAITH, LOVE, SERVICE</p>
        </div>
      </div>

      {/* Menu */}
      <div className="hidden md:flex gap-6 text-sm font-medium">
        <Link to="/" className="hover:text-indigo-500 transition">Home</Link>
        <Link to="/events" className="hover:text-indigo-500 transition">Events</Link>
        <Link to="/sermons" className="hover:text-indigo-500 transition">Sermons</Link>
        <Link to="/contact" className="hover:text-indigo-500 transition">Contact</Link>
      </div>

      {/* Dashboard */}
      <Link
        to="/login"
        className="border px-4 py-2 rounded-full text-sm hover:bg-gray-100"
      >
        Dashboard
      </Link>

    </nav>
  );
};

export default Navbar;
