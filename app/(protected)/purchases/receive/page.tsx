"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import PageHeader from "@/ui/components/header";
import DynamicForm from "@/ui/components/form";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// Hooks
import { useReceiveStock } from "@/services/api";
import { Package } from "lucide-react";

// Form Schema
const receiveStockSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  productId: z.string().min(1, "Product is required"),
  variantId: z.string().optional(),
  receivedQuantity: z.number().min(1, "Quantity must be at least 1"),
});

type ReceiveStockFormData = z.infer<typeof receiveStockSchema>;

// Form Configuration
const receiveStockFormConfig: DynamicFormConfig = {
  sections: [
    {
      title: "Receive Stock Information",
      description: "Enter the details of the stock you're receiving",
      icon: <Package className="h-5 w-5 text-primary" />,
      fields: [
        {
          name: "locationId",
          type: "select",
          label: "Location",
          placeholder: "Select location where stock is received",
          required: true,
          columnSpan: 6,
          optionsApi: "/locations",
          helperText: "Where is this stock being received?",
        },
        {
          name: "productId",
          type: "select",
          label: "Product",
          placeholder: "Select product",
          required: true,
          columnSpan: 6,
          optionsApi: "/products",
          helperText: "Which product are you receiving?",
        },
        {
          name: "variantId",
          type: "select",
          label: "Variant",
          placeholder: "Select variant (if applicable)",
          columnSpan: 6,
          dependsOn: "productId",
          dependsOnTemplate: "/products/:id/variants",
          helperText: "Select a product first to see variants",
        },
        {
          name: "receivedQuantity",
          type: "number",
          label: "Received Quantity",
          placeholder: "Enter quantity received",
          required: true,
          columnSpan: 6,
          validation: { min: 1 },
          helperText: "How many units did you receive?",
        },
      ],
    },
  ],
};

const defaultValues: ReceiveStockFormData = {
  locationId: "",
  productId: "",
  variantId: "",
  receivedQuantity: 1,
};

export default function ReceiveStockPage() {
  const router = useRouter();
  const receiveStockMutation = useReceiveStock();

  const form = useForm<ReceiveStockFormData>({
    resolver: zodResolver(receiveStockSchema),
    defaultValues,
  });

  const prepareSubmitData = (data: ReceiveStockFormData) => {
    // Transform data before submission - convert empty variantId to null
    return {
      ...data,
      variantId: data.variantId || null,
    };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Receive Stock"
        subTitle="Record incoming stock from purchases or transfers"
      />

      <Card>
        <CardHeader>
          <CardTitle>Stock Receipt Form</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicForm
            form={form}
            config={receiveStockFormConfig}
            onSubmit={prepareSubmitData}
            mutationHook={receiveStockMutation}
            actionsPlacement="bottom"
            submitLabel="Receive Stock"
            resetAfterSubmit={true}
          />

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Important Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Received quantity will be <strong>added</strong> to existing stock (not replaced)</li>
              <li>If the product doesn`t exist in this location, a new inventory record will be created</li>
              <li>Stock alerts will be automatically recalculated after receiving stock</li>
              <li>Variable products require a variant selection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
