import { NAV_ITEMS } from "@/constants/navigation"

export function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((item) => pathname.startsWith(item.href))

  if (item) {
    return item.name
  }

  if (pathname === "/") {
    return "Home"
  }

  return "ScholarAI"
}
