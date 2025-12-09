import { ReactNode } from 'react'

export default function ProductsLayout({
  children,
  drawer,
}: {
  children: ReactNode
  drawer: ReactNode
}) {
  return (
    <>
      {children}
      {drawer}
    </>
  )
}