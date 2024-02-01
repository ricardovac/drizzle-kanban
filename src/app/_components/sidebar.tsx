"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarNavItem } from "@/utils/types"
import { cn } from "lib/utils"

import { useAuthContext } from "../context/auth-context"

export function SidebarNav() {
  const pathname = usePathname()
  const { user } = useAuthContext()

  const items = [
    {
      items: [
        {
          title: "Quadros",
          href: `/u/${user.id}/boards`
        },
        {
          title: "Templates",
          href: "/templates"
        },
        {
          title: "Início",
          href: "/"
        }
      ]
    },
    {
      title: `Área de trabalho de ${user.name}`,
      items: [
        {
          title: "Quadros",
          href: `/u/${user.id}/boards`
        },
        {
          title: "Destaques",
          href: "#"
        },
        {
          title: "Membros",
          href: "#"
        }
      ]
    }
  ]

  return items.length ? (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className={cn("pb-8")}>
          <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-medium">{item.title}</h4>
          {item.items ? <SidebarNavItems items={item.items} pathname={pathname} /> : null}
        </div>
      ))}
    </div>
  ) : null
}

interface DocsSidebarNavItemsProps {
  items: SidebarNavItem[]
  pathname: string | null
}

export function SidebarNavItems({ items, pathname }: DocsSidebarNavItemsProps) {
  return items?.length ? (
    <div className="grid grid-flow-row auto-rows-max text-sm">
      {items.map((item, index) =>
        !item.disabled && item.href ? (
          <Link
            key={index}
            href={item.href}
            className={cn("flex w-full items-center rounded-md p-2 hover:underline", {
              "bg-muted": pathname === item.href
            })}
            target={item.external ? "_blank" : ""}
            rel={item.external ? "noreferrer" : ""}
          >
            {item.title}
          </Link>
        ) : (
          <span className="flex w-full cursor-not-allowed items-center rounded-md p-2 opacity-60">
            {item.title}
          </span>
        )
      )}
    </div>
  ) : null
}
