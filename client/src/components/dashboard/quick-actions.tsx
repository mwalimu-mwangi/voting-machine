import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Upload,
  Building2,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-lg font-heading font-semibold mb-4">Quick Actions</h2>

      <div className="space-y-3">
        <Link href="/admin/elections">
          <Button className="w-full bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center justify-between">
            <span className="font-medium">Add New Candidate</span>
            <UserPlus className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/admin/students">
          <Button variant="outline" className="w-full bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition flex items-center justify-between">
            <span className="font-medium">Upload Student IDs</span>
            <Upload className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/admin/departments">
          <Button variant="outline" className="w-full bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition flex items-center justify-between">
            <span className="font-medium">Manage Departments</span>
            <Building2 className="h-5 w-5" />
          </Button>
        </Link>

        <Link href="/admin/results">
          <Button variant="outline" className="w-full bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition flex items-center justify-between">
            <span className="font-medium">Export Results</span>
            <FileText className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
