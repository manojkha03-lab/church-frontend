import ScrollReveal from "./ScrollReveal";

const QuickInfo = () => {
  const items = [
    {
      title: "Service Time",
      desc: "Sunday: 9:00 AM",
      icon: "🕊"
    },
    {
      title: "Location",
      desc: "Narayanpur, Chhattisgarh – 494661",
      icon: "📍"
    },
    {
      title: "Sermons",
      desc: "Watch and listen to our latest sermons",
      icon: "📖"
    }
  ];

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">

        {items.map((item, index) => (
          <ScrollReveal key={index}>
            <div
              className="bg-gray-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition text-center"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-2">{item.desc}</p>
            </div>
          </ScrollReveal>
        ))}

      </div>
    </section>
  );
};

export default QuickInfo;
