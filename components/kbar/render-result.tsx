// coding-standard: maintained

import { KBarResults, useMatches } from 'kbar';
import ResultItem from './result-item';

export default function RenderResults() {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          // Section heading. Must be `muted-foreground`: `primary-foreground` is
          // the color that sits ON the primary swatch, so against the palette's
          // popover background it is near-invisible in both themes.
          <div className='text-muted-foreground px-4 py-2 text-xs font-medium tracking-wide uppercase'>
            {item}
          </div>
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId ?? ''}
          />
        )
      }
    />
  );
}
