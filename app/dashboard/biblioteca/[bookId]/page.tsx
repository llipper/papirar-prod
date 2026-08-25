import { BibliotecaReadingContent } from "@/components/biblioteca/biblioteca-reading-content"

export default async function BibliotecaBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>
  searchParams: Promise<{ node?: string; text?: string }>
}) {
  const { bookId } = await params
  const { node, text } = await searchParams
  return <BibliotecaReadingContent bookId={bookId} initialNodeKey={node} initialSelectedText={text} />
}
