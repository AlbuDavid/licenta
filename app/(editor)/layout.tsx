// Editor route group layout — fullscreen, no SiteHeader or CartDrawer.
// The root layout always wraps this, so we use h-[calc(100vh-56px)]
// to fill the viewport below the 56px SiteHeader.
export default function EditorRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
