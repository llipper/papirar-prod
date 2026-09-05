import { AdministrationReadingPage } from "@/components/dashboard/administration-reading-page"

export default async function AdministrationBookRoute({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params
  return <AdministrationReadingPage bookId={bookId} />
}
