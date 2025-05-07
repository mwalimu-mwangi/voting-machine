import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const candidateFormSchema = z.object({
  name: z.string().min(2, "Candidate name must be at least 2 characters"),
  department: z.string().min(2, "Department is required"),
  year: z.string().min(1, "Year is required"),
  positionId: z.string().min(1, "Position is required"),
  bio: z.string().optional(),
  platform: z.string().optional(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

export default function AdminCandidates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editCandidate, setEditCandidate] = useState<any>(null);
  
  // Form for adding/editing a candidate
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: "",
      department: "",
      year: "",
      positionId: "",
      bio: "",
      platform: "",
    },
  });
  
  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      name: "",
      department: "",
      year: "",
      positionId: "",
      bio: "",
      platform: "",
    });
    setEditCandidate(null);
  };
  
  // Set form values when editing
  const handleEdit = (candidate: any) => {
    setEditCandidate(candidate);
    form.reset({
      name: candidate.name,
      department: candidate.department,
      year: candidate.year,
      positionId: String(candidate.positionId),
      bio: candidate.bio || "",
      platform: candidate.platform || "",
    });
    setShowAddDialog(true);
  };
  
  // Query positions data
  const { data: positionsData, isLoading: positionsLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Set the first position as selected by default when data loads
  React.useEffect(() => {
    if (positionsData?.positions?.length > 0 && !selectedPosition) {
      setSelectedPosition(String(positionsData.positions[0].id));
    }
  }, [positionsData, selectedPosition]);
  
  // Query candidates data
  const { data: candidatesData, isLoading: candidatesLoading } = useQuery({
    queryKey: ["/api/candidates", selectedPosition, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [endpoint, positionId, search] = queryKey;
      let url = endpoint as string;
      
      if (positionId) url += `?positionId=${positionId}`;
      if (search) url += `${positionId ? '&' : '?'}search=${encodeURIComponent(search as string)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch candidates");
      return response.json();
    },
    enabled: !!selectedPosition,
  });
  
  // Mutation for adding a candidate
  const addCandidateMutation = useMutation({
    mutationFn: async (values: CandidateFormValues) => {
      const formattedValues = {
        ...values,
        positionId: parseInt(values.positionId),
      };
      const response = await apiRequest("POST", "/api/candidates", formattedValues);
      return response.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Candidate Added",
        description: "Candidate has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a candidate
  const updateCandidateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: CandidateFormValues }) => {
      const formattedValues = {
        ...values,
        positionId: parseInt(values.positionId),
      };
      const response = await apiRequest("PATCH", `/api/candidates/${id}`, formattedValues);
      return response.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Candidate Updated",
        description: "Candidate has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update candidate",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: CandidateFormValues) => {
    if (editCandidate) {
      updateCandidateMutation.mutate({ id: editCandidate.id, values });
    } else {
      addCandidateMutation.mutate(values);
    }
  };
  
  // Get position name by ID
  const getPositionName = (id: number) => {
    const position = positionsData?.positions?.find((p: any) => p.id === id);
    return position?.name || "Unknown Position";
  };
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Candidate Management</h2>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editCandidate ? "Edit Candidate" : "Add New Candidate"}</DialogTitle>
              <DialogDescription>
                {editCandidate 
                  ? "Edit an existing candidate's details." 
                  : "Add a new candidate for a position."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="Political Science">Political Science</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Freshman">Freshman</SelectItem>
                            <SelectItem value="Sophomore">Sophomore</SelectItem>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="positionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {positionsData?.positions?.map((position: any) => (
                            <SelectItem key={position.id} value={String(position.id)}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the candidate" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Candidate's election platform" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={addCandidateMutation.isPending || updateCandidateMutation.isPending}
                  >
                    {(addCandidateMutation.isPending || updateCandidateMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editCandidate ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editCandidate ? "Update Candidate" : "Add Candidate"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>
            Manage candidates running for different positions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search & Position Tabs */}
          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-grow max-w-md">
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search candidates..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {positionsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs 
              defaultValue={selectedPosition || ""}
              value={selectedPosition || ""}
              onValueChange={setSelectedPosition || undefined}
              className="w-full"
            >
              <TabsList className="mb-4 w-full justify-start overflow-auto">
                {positionsData?.positions?.map((position: any) => (
                  <TabsTrigger key={position.id} value={String(position.id)}>
                    {position.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {positionsData?.positions?.map((position: any) => (
                <TabsContent key={position.id} value={String(position.id)}>
                  {candidatesLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {candidatesData?.candidates?.length > 0 ? (
                        candidatesData.candidates.map((candidate: any) => (
                          <div key={candidate.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-3">
                                  <h3 className="text-lg font-medium">{candidate.name}</h3>
                                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                                    {candidate.year}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-500 mt-1">{candidate.department}</p>
                                {candidate.bio && (
                                  <div className="mt-3">
                                    <h4 className="text-sm font-medium">Biography:</h4>
                                    <p className="text-sm text-neutral-600 mt-1">{candidate.bio}</p>
                                  </div>
                                )}
                                {candidate.platform && (
                                  <div className="mt-3">
                                    <h4 className="text-sm font-medium">Platform:</h4>
                                    <p className="text-sm text-neutral-600 mt-1">{candidate.platform}</p>
                                  </div>
                                )}
                              </div>
                              <Button variant="outline" onClick={() => handleEdit(candidate)}>
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center p-8 text-neutral-500">
                          No candidates found for this position.
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
