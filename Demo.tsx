import { NumberField } from "@ui/components/number-field";
import React from "react";

export function Demo() {
  const [n, setN] = React.useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3 p-6 max-w-xs">
      <NumberField value={n} onChange={setN} placeholder="plain float" />
      <NumberField value={n} onChange={setN} precision={2} min={0} max={100} placeholder="0–100, 2dp" />
      <NumberField value={n} onChange={setN} showSteppers step={1} min={0} precision={0} />
      <NumberField value={n} onChange={setN} showSteppers size="sm" step={0.5} precision={1} />
      <pre className="text-xs">value: {JSON.stringify(n)} typeof: {typeof n}</pre>
    </div>
  );
}