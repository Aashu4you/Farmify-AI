export default function QuickActions() {
  const actions = [
    "Add Crop",
    "View Tasks",
    "Weather",
    "AI Assistant",
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mt-8">
      <h2 className="text-2xl font-bold text-green-700 mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action}
            className="bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}