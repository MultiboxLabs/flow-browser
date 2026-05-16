export function IconSection() {
  return (
    <>
      {new Array(100).fill(0).map((_, index) => (
        <div key={index} className="h-10 w-10 bg-red-500">
          {index}
        </div>
      ))}
    </>
  );
}
