"use client";

import DynamicForm from "@/ui/components/form";
import { Card, CardContent } from "@/ui/components/card";
import type { UseFormReturn } from "react-hook-form";
import type { FC } from "react";

type Props = {
  form: UseFormReturn<any>;
  config: any;
  onFieldChange?: (name: string, value: unknown) => void;
};

export const SupplierForm: FC<Props> = ({ form, config, onFieldChange }) => {
  return (
    <Card>
      <CardContent>
        {/* <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div> */}
        <DynamicForm form={form} config={config} onFieldChange={onFieldChange} hideCancel />
      </CardContent>
    </Card>
  );
};

export default SupplierForm;
