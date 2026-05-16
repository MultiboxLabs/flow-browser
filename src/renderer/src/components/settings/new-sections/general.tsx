export function GeneralSection() {
  return (
    <>
      {new Array(100).fill(0).map((_, index) => (
        <div key={index} className="h-10 w-10 bg-green-500">
          {index}
        </div>
      ))}
    </>
  );
}
