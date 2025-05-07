import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const positionFormSchema = z.object({
  name: z.string().min(2, "Position name must be at least 2 characters"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PositionFormValues = z.infer<typeof positionFormSchema>;

export default function AdminPositions() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editPosition, setEditPosition] = useState<any>(null);
  
  // Form for adding/editing a position
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });
  
  // Reset form when dialog closes
  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      isActive: true,
    });
    setEditPosition(null);
  };
  
  // Set form values when editing
  const handleEdit = (position: any) => {
    setEditPosition(position);
    form.reset({
      name: position.name,
      description: position.description || "",
      isActive: position.isActive,
    });
    setShowAddDialog(true);
  };
  
  // Query positions data
  const { data, isLoading } = useQuery({
    queryKey: ["/api/positions"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error("Failed to fetch positions");
      return response.json();
    },
  });
  
  // Mutation for adding a position
  const addPositionMutation = useMutation({
    mutationFn: async (values: PositionFormValues) => {
      const response = await apiRequest("POST", "/api/positions", values);
      return response.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({
        title: "Position Added",
        description: "Position has been successfully added.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add position",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a position
  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: PositionFormValues }) => {
      const response = await apiRequest("PATCH", `/api/positions/${id}`, values);
      return response.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({
        title: "Position Updated",
        description: "Position has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update position",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for toggling position active status
  const togglePositionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/positions/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      toast({
        title: "Position Updated",
        description: "Position status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update position",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: PositionFormValues) => {
    if (editPosition) {
      updatePositionMutation.mutate({ id: editPosition.id, values });
    } else {
      addPositionMutation.mutate(values);
    }
  };
  
  // Handle toggle position active status
  const handleToggleActive = (id: number, currentStatus: boolean) => {
    togglePositionMutation.mutate({ id, isActive: !currentStatus });
  };
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Position Management</h2>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editPosition ? "Edit Position" : "Add New Position"}</DialogTitle>
              <DialogDescription>
                {editPosition 
                  ? "Edit an existing position's details." 
                  : "Create a new position for candidates to run for."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., President" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the position responsibilities..." 
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this position available for voting
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={addPositionMutation.isPending || updatePositionMutation.isPending}
                  >
                    {(addPositionMutation.isPending || updatePositionMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editPosition ? "Updating..." : "Adding..."}
                      </>
                    ) : (
                      editPosition ? "Update Position" : "Add Position"
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
          <CardTitle>Positions</CardTitle>
          <CardDescription>
            Manage the positions that candidates can run for in the election.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {data?.positions?.length > 0 ? (
                data.positions.map((position: any) => (
                  <div key={position.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h3 className="text-lg font-medium">{position.name}</h3>
                      {position.description && (
                        <p className="text-sm text-neutral-500 mt-1">{position.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-neutral-500">Active</span>
                        <Switch
                          checked={position.isActive}
                          onCheckedChange={() => handleToggleActive(position.id, position.isActive)}
                          disabled={togglePositionMutation.isPending}
                        />
                      </div>
                      <Button variant="outline" onClick={() => handleEdit(position)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-neutral-500">
                  No positions have been created yet. Add one to get started.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
