import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import AboutSection from "./AboutSection";
import QuickInfo from "./QuickInfo";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white text-gray-800">

      <Navbar />

      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 
      bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{ backgroundImage: "url('/church-image.svg')" }}>

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />

        {/* Floating Background Icons */}
        <div className="absolute inset-0 overflow-hidden z-0">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, x: 0, opacity: 0.08 }}
              animate={{
                y: [0, -40, 0],
                x: [0, 25, 0]
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute text-xl text-blue-300"
              style={{
                top: `${10 + i * 10}%`,
                left: `${(i * 12) % 100}%`,
                filter: "drop-shadow(0 0 6px rgba(59,130,246,0.4))"
              }}
            >
              ✝️
            </motion.div>
          ))}
        </div>

        {/* Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute w-[500px] h-[500px] bg-blue-300 opacity-20 blur-3xl rounded-full top-10"
        />

        {/* TITLE */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-semibold tracking-tight z-10"
        >
          <span className="text-white">
            Sacred
          </span>
          <br />
          <span className="text-indigo-300">
            Heart
          </span>
        </motion.h1>

        {/* TAGLINE */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-blue-200 tracking-[4px] text-xs md:text-sm z-10"
        >
          A SANCTUARY OF GRACE AND QUIET BEAUTY
        </motion.p>

        {/* QUOTE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-xl shadow-sm mt-8 z-10 border border-white/20 hover:border-indigo-300 transition"
        >
          <p className="italic text-white/90 text-lg">
            "Be still, and know that I am God."
          </p>
          <p className="text-blue-300 text-sm font-semibold mt-2">
            PSALM 46:10
          </p>
        </motion.div>

        {/* BUTTON */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="z-10"
        >
          <button
            onClick={() => navigate('/register')}
            className="mt-12 px-10 py-3 rounded-full text-white font-medium
            bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
            hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600
            transition-all duration-300 ease-in-out
            shadow-md hover:shadow-xl"
          >
            Join Our Community
          </button>
        </motion.div>

      </section>

      <AboutSection />
      <QuickInfo />

    </div>
  );
};

export default Home;