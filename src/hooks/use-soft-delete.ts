
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type SoftDeleteOptions = {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

// Define valid table names from the Database type
type TableNames = keyof Database['public']['Tables'] | keyof Database['public']['Views'];

export function useSoftDelete(tableName: TableNames, options?: SoftDeleteOptions) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { toast } = useToast();

  const softDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from(tableName)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Item removed",
        description: `The item has been successfully removed.`,
      });
      
      options?.onSuccess?.();
      
    } catch (error: any) {
      console.error(`Error soft deleting from ${tableName}:`, error);
      
      toast({
        title: "Removal failed",
        description: error.message || `Failed to remove the item.`,
        variant: "destructive",
      });
      
      options?.onError?.(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return { softDelete, isDeleting };
}
