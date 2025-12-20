"use client";
import { useState } from "react";
import { Button } from "@ui/components/button";
import {
  Plus
} from "lucide-react";

export default function SalesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddSales = () => {
    setIsDrawerOpen(true);
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">
            Manage your sales catalog and variants
          </p>
        </div>
        <Button onClick={handleAddSales}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sales
        </Button>
      </div>
      {/* {isDrawerOpen && (
        <SalesDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          productId={null}
          onSuccess={() => {}}
        />
      )} */}
    </div>
  );
}
