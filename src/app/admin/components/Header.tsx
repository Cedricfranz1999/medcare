"use client";
import Link from "next/link";
import {
  CircleUser,
  Home,
  Menu,
  Package2,
  User,
  Users,
  ClipboardList,
  Pill,
  FileText,
  Bell,
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
import { useRouter } from "next/navigation";
import { useAdminStore } from "~/app/store/adminStore";
import { Label } from "~/components/ui/label";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

// Define the type for low stock medicines
type LowStockMedicine = {
  id: number;
  name: string;
  stock: number;
};

const Header = () => {
  const router = useRouter();
  const username = useAdminStore((state) => state.username);
  const clearUsername = useAdminStore((state) => state.logout);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockMedicines, setLowStockMedicines] = useState<LowStockMedicine[]>([]);
  const [showLowStock, setShowLowStock] = useState(false);

  // Fetch the count of low stock medicines with notificationopen: true
  const { data: lowStockCountData ,refetch:refetchCount } = api.medicine.getLowStockCount.useQuery();

  // Fetch the list of all low stock medicines
  const { data: lowStockData ,refetch } = api.medicine.getLowStock.useQuery();

  // Mutation to update notificationopen for low stock medicines
  const { mutate: updateLowStockNotificationOpen } = api.medicine.updateLowStockNotificationOpen.useMutation();

  useEffect(() => {
    if (lowStockCountData) {
      setLowStockCount(lowStockCountData.count);
    }
  }, [lowStockCountData]);

  useEffect(() => {
    if (lowStockData) {
      setLowStockMedicines(lowStockData.medicines);
    }
  }, [lowStockData]);

  const handleLogout = () => {
    clearUsername();
    router.push("/sign-in");
  };

  const handleNotificationClick = () => {
    updateLowStockNotificationOpen({ to: false });
  };

  const handleNotificationBlur = () => {
    updateLowStockNotificationOpen({ to: true });
    refetchCount()
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
              <span className="sr-only">CAREMED System</span>
            </Link>
            {[
              {
                href: "/admin/dashboard",
                icon: <Home className="h-5 w-5" />,
                label: "Dashboard",
              },
              {
                href: "/admin/requests",
                icon: <ClipboardList className="h-5 w-5" />,
                label: "Requests",
              },
              {
                href: "/admin/medicine",
                icon: <Pill className="h-5 w-5" />,
                label: "Medicine",
                children: [
                  {
                    href: "/admin/medicine/list",
                    label: "List",
                  },
                  {
                    href: "/admin/medicine/category",
                    label: "Category",
                  },
                ],
              },
              {
                href: "/admin/users",
                icon: <Users className="h-5 w-5" />,
                label: "Users",
              },
              {
                href: "/admin/reports",
                icon: <FileText className="h-5 w-5" />,
                label: "Reports",
              },
            ].map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 transition-all hover:bg-white hover:text-[#156cbc]"
                >
                  {item.icon}
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-8">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-sm transition-all hover:bg-white hover:text-[#156cbc]"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1" />
      <div className="flex items-center gap-4">
        <DropdownMenu
          open={showLowStock}
          onOpenChange={(open) => {
            setShowLowStock(open);
            if (open) {
              handleNotificationClick();
              refetch()
            } else {
              handleNotificationBlur();
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative rounded-full bg-white text-[#156cbc] hover:bg-[#f0f0f0]"
            >
              <Bell className="h-5 w-5" />
              {lowStockCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {lowStockCount}
                </span>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-md border border-[#b0daef] bg-white text-[#156cbc] shadow-md"
          >
            <DropdownMenuLabel className="text-sm text-[#0fa7d1]">
              Low Stock Medicines
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {lowStockMedicines.length > 0 ? (
              lowStockMedicines.map((medicine) => (
                <DropdownMenuItem
                  key={medicine.id}
                  className="cursor-pointer text-[#156cbc] hover:bg-[#0ca4d4] hover:text-white"
                >
                  <div className="flex items-center justify-between " onClick={()=>router.push("/admin/medicine/list")}>
                    <span>{medicine.name}</span>
                    <span className="text-xs text-red-500">
                      Stock: {medicine.stock}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem className="cursor-pointer text-[#156cbc]">
                No low stock medicines
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
                <User size={16} />
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
