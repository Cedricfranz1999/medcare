"use client";
import Link from "next/link";
import {
  CircleUser,
  Home,
  Menu,
  Package2,
  Users,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { DialogTitle } from "~/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAdminStore } from "~/app/store/adminStore";
import { Label } from "~/components/ui/label";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();
  const username = useAdminStore((state) => state.username);
  const clearUsername = useAdminStore((state) => state.logout);

  const handleLogout = () => {
    clearUsername();
    router.push("/sign-in");
  };

  return (
    <header className="flex h-14 items-center gap-4 border border-[#b0daef] bg-[#07c0dd] px-4 text-white lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 border-white text-white md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex flex-col bg-gradient-to-b from-[#0ac2de] via-[#0fa7d1] to-[#156cbc] text-white"
        >
          <VisuallyHidden>
            <DialogTitle>Navigation Menu</DialogTitle>
          </VisuallyHidden>
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Package2 className="h-6 w-6" />
              <span className="sr-only">NLCM</span>
            </Link>
            {[
              {
                href: "/admin/dashboard",
                icon: <Home className="h-5 w-5" />,
                label: "Dashboard",
              },
              {
                href: "/admin/users",
                icon: <Users className="h-5 w-5" />,
                label: "Users",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all hover:bg-white hover:text-[#156cbc]"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1" />
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-white text-[#156cbc] hover:bg-[#f0f0f0]"
            >
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-10 rounded-md border border-[#b0daef] bg-white text-[#156cbc] shadow-md"
          >
            <DropdownMenuLabel className="text-sm text-[#0fa7d1]">
              <div className="flex items-center justify-start gap-2">
                <CircleUser size={16} />
                <Label>{username}</Label>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[#156cbc] hover:bg-[#0ca4d4] hover:text-white"
              onClick={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
