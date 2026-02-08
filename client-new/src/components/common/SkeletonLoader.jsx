const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-32 mb-4"></div>
        ))}
      </div>
    );
  }

  if (type === 'calendar') {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
    );
  }

  return <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>;
};

export default SkeletonLoader;
