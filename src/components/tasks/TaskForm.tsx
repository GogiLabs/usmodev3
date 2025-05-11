import { useState } from "react";
import { useTask } from "@/contexts/task/TaskContext";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskTag } from "@/types/Task";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

const taskFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  points: z.coerce.number().int().min(1).max(100),
  tag: z.enum(['Cleaning', 'Cooking', 'Laundry', 'Dishes', 'GroceryShopping', 
    'BillsAndFinances', 'RepairsAndMaintenance', 'PetCare', 'Gardening', 'Other']),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

export function TaskForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { addTask } = useTask();
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: "",
      points: 5,
      tag: "Other",
    },
  });
  
  const onSubmit = (data: TaskFormData) => {
    addTask({
      description: data.description,
      points: data.points,
      tag: data.tag as TaskTag,
    });
    form.reset();
    setIsFormOpen(false);
  };
  
  const allTags: TaskTag[] = [
    'Cleaning', 'Cooking', 'Laundry', 'Dishes', 'GroceryShopping', 
    'BillsAndFinances', 'RepairsAndMaintenance', 'PetCare', 'Gardening', 'Other'
  ];
  
  if (!isFormOpen) {
    return (
      <Button
        onClick={() => setIsFormOpen(true)}
        variant="outline"
        className="w-full flex items-center justify-center py-6 border-dashed border-2 bg-transparent text-accent hover:text-accent-foreground"
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Task
      </Button>
    );
  }
  
  return (
    <div className="p-4 border rounded-lg mb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl>
                  <Input placeholder="What needs to be done?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Task
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
