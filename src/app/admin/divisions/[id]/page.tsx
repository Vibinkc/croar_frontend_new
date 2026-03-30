import { redirect } from "next/navigation";

export default async function DivisionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/admin/divisions/${id}/admins`);
}
