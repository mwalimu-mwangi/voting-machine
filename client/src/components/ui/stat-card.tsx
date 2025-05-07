import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  href: string;
  linkText: string;
}

export default function StatCard({ title, value, icon, href, linkText }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="rounded-md bg-primary-100 p-2 text-primary-600">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-neutral-500">{title}</dt>
              <dd className="mt-1">
                <div className="text-lg font-semibold text-neutral-900">{value.toLocaleString()}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-5 py-3">
        <div className="text-sm">
          <Link href={href} className="font-medium text-primary-600 hover:text-primary-500">
            {linkText}
          </Link>
        </div>
      </div>
    </Card>
  );
}
