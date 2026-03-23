const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-6 py-20">

      <div className="max-w-4xl mx-auto text-center">

        <h1 className="text-4xl font-bold mb-6">
          Contact Us
        </h1>

        <p className="text-gray-600 mb-10">
          We would love to hear from you. Reach out to us for prayer, support, or any inquiries.
        </p>

        <div className="grid md:grid-cols-2 gap-6 text-left">

          {/* Location */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-2">📍 Location</h2>
            <p>Narayanpur, Chhattisgarh – 494661</p>
          </div>

          {/* Phone */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-2">📞 Phone</h2>
            <p>+91 9876543210</p>
          </div>

          {/* Email */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-2">✉️ Email</h2>
            <p>sacredheartchurch@gmail.com</p>
          </div>

          {/* Service Time */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold text-lg mb-2">🕊 Service Time</h2>
            <p>Sunday – 9:00 AM</p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Contact;
