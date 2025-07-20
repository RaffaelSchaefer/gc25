"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function InteractiveBreadcrumb({ ...props }: React.ComponentProps<"nav">) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const locale = segments[0];
  const pageSegments = segments.slice(1);
  const filteredSegments = pageSegments.filter(segment => segment !== 'home');

  return (
    <Breadcrumb {...props}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${locale}/home`}>Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {filteredSegments.length > 0 && <BreadcrumbSeparator />}
        {filteredSegments.map((segment, index) => {
          const href = `/${locale}/${pageSegments.slice(0, index + 1).join('/')}`
          const isLast = index === filteredSegments.length - 1
          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{segment}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}