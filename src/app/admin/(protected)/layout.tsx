import { redirect } from "next/navigation";
import Link from "next/link";
import { hasValidAdminSession } from "@/lib/admin/adminAuth";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await hasValidAdminSession();
  if (!ok) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <Link href="/admin/refund-requests" className="text-lg font-bold text-cocoa">
          운의결 KIDS Admin
        </Link>
        <AdminLogoutButton />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
