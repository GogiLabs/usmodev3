
import { useState } from "react";
import { useReward } from "@/contexts/reward/RewardContext";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";

const rewardFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  pointCost: z.coerce.number().int().min(1).max(1000),
});

type RewardFormData = z.infer<typeof rewardFormSchema>;

export function RewardForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { addReward } = useReward();
  
  const form = useForm<RewardFormData>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      description: "",
      pointCost: 20,
    },
  });
  
  const onSubmit = (data: RewardFormData) => {
    addReward({
      description: data.description,
      pointCost: data.pointCost,
    });
    form.reset();
    setIsFormOpen(false);
  };
  
  if (!isFormOpen) {
    return (
      <Button
        onClick={() => setIsFormOpen(true)}
        variant="outline"
        className="w-full flex items-center justify-center py-6 border-dashed border-2 bg-transparent text-accent hover:text-accent-foreground"
      >
        <Plus className="mr-2 h-4 w-4" /> Add New Reward
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
                <FormLabel>Reward Description</FormLabel>
                <FormControl>
                  <Input placeholder="What's the reward?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pointCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Point Cost</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Reward
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
