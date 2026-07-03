import { JobDetailPage } from "@/features/jobs/job-detail-page";

export default async function JobDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobDetailPage id={id} />;
}
