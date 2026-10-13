'use client';
// coding-standard: maintained

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@ui/components/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { Fragment } from 'react';
import { ChevronRight, SlashIcon } from 'lucide-react';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;

  return (
    <Breadcrumb className='hidden md:flex'>
      <BreadcrumbList className='sm:gap-1.5'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            // Keyed by position, not link: two crumbs can share one link —
            // "Online Store" (/ecommerce, a redirect) links to /ecommerce/orders,
            // which is also the Online Orders crumb on that page.
            <Fragment key={`${index}-${item.title}`}>
              {isLast ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbItem className='hidden md:block'>
                    {item.link ? (
                      <BreadcrumbLink href={item.link}>
                        {item.title}
                      </BreadcrumbLink>
                    ) : (
                      <span>{item.title}</span>
                    )}
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className='hidden md:block'>
                    <ChevronRight />
                  </BreadcrumbSeparator>
                </>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
