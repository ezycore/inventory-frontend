"use client";

import DynamicForm from "@/ui/components/form";
import { Card, CardContent } from "@/ui/components/card";
import type { UseFormReturn } from "react-hook-form";
import type { FC } from "react";

type Props = {
  form: UseFormReturn<any>;
  config: any;
  onFieldChange?: (name: string, value: unknown) => void;
  onSubmit?: (data: any) => void;
  submitLabel?: string;
  title?: string;
  actions?: React.ReactNode;
};

export const ProductForm: FC<Props> = ({ form, config, onFieldChange, onSubmit, submitLabel, title = "Add Products", actions }) => {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
            <h3 className="font-semibold text-sm">{title}</h3>
          </div>
          {actions && <div className="flex items-center">{actions}</div>}
        </div>
        <DynamicForm form={form} config={config} onFieldChange={onFieldChange} onSubmit={onSubmit} submitLabel={submitLabel} hideCancel />
      </CardContent>
    </Card>
  );
};

export default ProductForm;
