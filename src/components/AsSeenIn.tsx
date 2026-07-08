const media = [
  "Daily Telegraph",
  "Mail Online",
  "The Sunday Times",
  "The Times",
  "The HuffPost",
  "BBC Radio 2",
];

const AsSeenIn = () => {
  return (
    <section className="py-8 bg-charcoal border-b border-primary-foreground/10">
      <div className="container mx-auto px-6">
        <p className="font-body text-primary-foreground/40 text-xs tracking-[0.25em] uppercase text-center mb-5">
          As Seen In
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center justify-items-center md:justify-center gap-y-4 gap-x-6 md:gap-x-10">
          {media.map((name) => (
            <span
              key={name}
              className="font-display text-xs sm:text-sm md:text-base font-semibold text-primary-foreground/50 tracking-wide whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AsSeenIn;
