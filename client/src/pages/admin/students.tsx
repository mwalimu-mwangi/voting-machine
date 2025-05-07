import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/ui/data-table";
import { Loader2, Search, Upload, UserPlus, UserMinus, RefreshCw, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const studentFormSchema = z.object({
  studentId: z.string().min(3, "Student ID must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

// Helper function to transform and sanitize student data for proper display
const transformStudentData = (students: any[] = []) => {
  return students.map(student => {
    // Create sanitized structure with fallbacks for null/undefined values
    return {
      ...student,
      department: student.department || "-",
      // Ensure original field exists for consistent access in table cells
      original: {
        ...student,
        studentId: student.studentId || "-",
        department: student.department || "-",
        isRegistered: Boolean(student.isRegistered), // Convert to boolean
        user: student.user || null // Ensure user object exists or is null
      }
    };
  });
};

export default function AdminStudents() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [regFilter, setRegFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  
  // Form for adding a new student
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      department: "",
    },
  });
  
  // Form for editing a student
  const editForm = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      department: "",
    },
  });
  
  // Mutation for editing a student
  const editStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues & { id: number }) => {
      const { id, ...data } = values;
      const response = await apiRequest("PATCH", `/api/students/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setShowEditDialog(false);
      setEditingStudent(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Updated",
        description: "Student information has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await apiRequest("DELETE", `/api/students/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete student");
        }
        return await response.json().catch(() => true); // Handle both JSON and non-JSON responses
      } catch (error: any) {
        throw new Error(error.message || "Failed to delete student");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Deleted",
        description: "Student has been successfully deleted from the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for registering a student
  const registerStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await apiRequest("PATCH", `/api/students/${id}`, { isRegistered: true });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to register student");
        }
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to register student");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Registered",
        description: "Student has been successfully registered.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deregistering a student
  const deregisterStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const response = await apiRequest("PATCH", `/api/students/${id}`, { isRegistered: false });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to deregister student");
        }
        return await response.json();
      } catch (error: any) {
        throw new Error(error.message || "Failed to deregister student");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Deregistered",
        description: "Student has been successfully deregistered.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deregistration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle editing a student
  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    editForm.reset({
      studentId: student.studentId,
      department: student.department,
    });
    setShowEditDialog(true);
  };
  
  // Handle submitting edited student data
  const onEditSubmit = (values: StudentFormValues) => {
    if (editingStudent) {
      editStudentMutation.mutate({
        id: editingStudent.id,
        ...values
      });
    }
  };
  
  // Handle deleting a student
  const handleDeleteStudent = (id: number) => {
    if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      deleteStudentMutation.mutate(id);
    }
  };
  
  // Handle registering a student
  const handleRegisterStudent = (id: number) => {
    registerStudentMutation.mutate(id);
  };
  
  // Handle deregistering a student
  const handleDeregisterStudent = (id: number) => {
    deregisterStudentMutation.mutate(id);
  };
  
  // Query students data
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ["/api/students", page, searchQuery, regFilter, deptFilter],
    queryFn: async ({ queryKey }) => {
      const [endpoint, page, search, reg, dept] = queryKey;
      let url = `${endpoint}?page=${page}`;
      
      if (search) url += `&search=${encodeURIComponent(search as string)}`;
      if (reg !== "all") url += `&registered=${reg === "registered"}`;
      if (dept !== "all") url += `&department=${encodeURIComponent(dept as string)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch students");
      const rawData = await response.json();
      
      // Transform the data to handle null values and prevent errors
      return {
        ...rawData,
        students: transformStudentData(rawData.students)
      };
    },
  });
  
  // Mutation for adding a single student
  const addStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const response = await apiRequest("POST", "/api/students", values);
      return response.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Added",
        description: "Student has been successfully added to the system.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for importing students from CSV
  const importStudentsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import students");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setFileUpload(null);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Students Imported",
        description: `Successfully imported ${data.count} students.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
    }
  };
  
  // Handle file upload submission
  const handleImport = () => {
    if (fileUpload) {
      importStudentsMutation.mutate(fileUpload);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission for adding a student
  const onSubmit = (values: StudentFormValues) => {
    addStudentMutation.mutate(values);
  };
  
  // Table columns
  const columns = [
    { header: "Student ID", accessorKey: "studentId" },
    { 
      header: "Name", 
      accessorKey: "user.fullName",
      cell: ({ row }: any) => (row.original.user && row.original.user.fullName) ? row.original.user.fullName : "-" 
    },
    { header: "Department", accessorKey: "department" },
    {
      header: "Registration Status",
      accessorKey: "isRegistered",
      cell: ({ row }: any) => (
        row.original.isRegistered ? 
          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">Registered</Badge> : 
          <Badge variant="outline" className="bg-neutral-100 text-neutral-800 hover:bg-neutral-100">Unregistered</Badge>
      )
    },
    {
      header: "Email",
      accessorKey: "user.email",
      cell: ({ row }: any) => (row.original.user && row.original.user.email) ? row.original.user.email : "-"
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditStudent(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {row.original.isRegistered ? (
                <DropdownMenuItem onClick={() => handleDeregisterStudent(row.original.id)}>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Deregister
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleRegisterStudent(row.original.id)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteStudent(row.original.id)}
                className="text-red-600 hover:text-red-800 focus:text-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];
  
  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold text-neutral-800">Student Management</h2>
      
      {/* Import Student IDs card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium leading-6 text-neutral-900">Import Student IDs</h3>
          <p className="mt-2 max-w-xl text-sm text-neutral-500">
            Upload a CSV file containing verified student IDs for registration.
          </p>
          <div className="mt-5 sm:flex sm:items-center">
            <div className="sm:flex-grow">
              <input 
                type="file" 
                id="file-upload" 
                onChange={handleFileChange}
                className="sr-only" 
                accept=".csv" 
              />
              <Label 
                htmlFor="file-upload" 
                className="relative cursor-pointer rounded-md bg-white font-medium text-primary-600 focus-within:outline-none hover:text-primary-500"
              >
                <span className="inline-flex w-full justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50">
                  Choose CSV file
                </span>
              </Label>
              <span className="ml-4 text-sm text-neutral-500">
                {fileUpload ? fileUpload.name : "No file selected"}
              </span>
            </div>
            <Button 
              className="mt-3 sm:mt-0 sm:ml-3" 
              onClick={handleImport}
              disabled={!fileUpload || importStudentsMutation.isPending}
            >
              {importStudentsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Import
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Student Database card */}
      <Card>
        <CardHeader>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <CardTitle>Student Database</CardTitle>
              <CardDescription className="mt-1">
                A list of all verified students with their registration status.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => refetch()}
                className="mt-4 sm:mt-0"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="mt-4 sm:mt-0">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Add a new student to the verification database.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter student ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={addStudentMutation.isPending}>
                          {addStudentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : "Add Student"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Edit Student Dialog */}
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Student</DialogTitle>
                    <DialogDescription>
                      Update student information in the verification database.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      <FormField
                        control={editForm.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter student ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={editForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={editStudentMutation.isPending}>
                          {editStudentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : "Update Student"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Filter Controls */}
          <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-grow max-w-md">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search by ID, name or email"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-row space-x-3">
              <Select value={regFilter} onValueChange={setRegFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Registration Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="unregistered">Unregistered</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Arts & Humanities">Arts & Humanities</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Students Table */}
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="mb-4 text-red-500">Failed to load student data</p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : (
            <DataTable
              data={data?.students || []}
              columns={columns}
              pagination={{
                page,
                pageCount: data?.pagination?.totalPages || 1,
                onPageChange: setPage,
                totalItems: data?.pagination?.total || 0,
              }}
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
