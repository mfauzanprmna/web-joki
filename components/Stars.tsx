export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i <= rating ? "#FFB238" : "#413759"}
          aria-hidden="true"
        >
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6L12 2z" />
        </svg>
      ))}
    </div>
  );
}
