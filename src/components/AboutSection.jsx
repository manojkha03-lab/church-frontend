const AboutSection = () => {
  return (
    <section className="py-20 px-6 bg-white text-center">

      <div className="max-w-3xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-serif text-gray-800 mb-6">
          Welcome to Sacred Heart Church
        </h2>

        <p className="text-gray-600 leading-relaxed mb-6">
          Sacred Heart Church is a place of faith, love, and service. 
          We welcome all who seek peace, hope, and a deeper connection with God.
        </p>

        <p className="text-gray-600 leading-relaxed mb-10">
          Our mission is to guide people in faith, strengthen our community, 
          and spread the message of love through worship, prayer, and service.
        </p>

        {/* Bible Verse */}
        <div className="italic text-gray-500 border-l-4 border-blue-400 pl-4 text-left max-w-md mx-auto">
          "For where two or three gather in my name, there am I with them."
          <div className="text-blue-500 mt-2 text-sm">
            Matthew 18:20
          </div>
        </div>

      </div>

    </section>
  );
};

export default AboutSection;
