type Props = {
  title: string;
  value: string;
};

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-gray-500 text-lg">
        {title}
      </h2>

      <p className="text-3xl font-bold text-green-700 mt-2">
        {value}
      </p>
    </div>
  );
}