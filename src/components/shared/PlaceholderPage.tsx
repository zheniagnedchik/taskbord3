export function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h1>
      <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
