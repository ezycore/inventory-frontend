"use client";

import { ImportLowStockDialog as RawImportDialog } from "@/components/purchases";
import type { FC } from "react";

type Props = Parameters<typeof RawImportDialog>[0];

export const ImportLowStockWrapper: FC<Props> = (props) => {
  return <RawImportDialog {...props} />;
};

export default ImportLowStockWrapper;
