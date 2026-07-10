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
import { SlashIcon } from 'lucide-react';

export function Breadcrumbs() {
  const items = useBreadcrumbs();
  if (items.length === 0) return null;

  return (
    <Breadcrumb className='hidden md:flex'>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.link ?? `${item.title}-${index}`}>
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
                    <SlashIcon />
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
