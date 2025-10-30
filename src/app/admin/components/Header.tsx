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
import { useAdminStore } from "~/app/store/adminStore";
import { Label } from "~/components/ui/label";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

// Define the type for low stock medicines
type LowStockMedicine = {
  id: number;
  name: string;
  stock: number;
};
// Define the type for near expiry medicines
type NearExpiryMedicine = {
  id: number;
  name: string;
  expiryDate: Date;
  stock: number;
};
// Define the type for expired medicines
type ExpiredMedicine = {
  id: number;
  name: string;
  expiryDate: Date;
  stock: number;
};

const Header = () => {
  const router = useRouter();
  const username = useAdminStore((state) => state.username);
  const clearUsername = useAdminStore((state) => state.logout);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [nearExpiryCount, setNearExpiryCount] = useState<number>(0);
  const [expiredCount, setExpiredCount] = useState<number>(0);
  const [lowStockMedicines, setLowStockMedicines] = useState<LowStockMedicine[]>([]);
  const [nearExpiryMedicines, setNearExpiryMedicines] = useState<NearExpiryMedicine[]>([]);
  const [expiredMedicines, setExpiredMedicines] = useState<ExpiredMedicine[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'lowStock' | 'nearExpiry' | 'expired'>('lowStock');

  // Fetch the count of low stock medicines with notificationopen: true
  const { data: lowStockCountData, refetch: refetchLowStockCount } = api.medicine.getLowStockCount.useQuery();
  // Fetch the count of near expiry medicines with notificationopen: true
  const { data: nearExpiryCountData, refetch: refetchNearExpiryCount } = api.medicine.getNearExpiryCount.useQuery();
  // Fetch the count of expired medicines with notificationopen: true
  const { data: expiredCountData, refetch: refetchExpiredCount } = api.medicine.getExpiredCount.useQuery();
  // Fetch the list of all low stock medicines
  const { data: lowStockData, refetch: refetchLowStock } = api.medicine.getLowStock.useQuery();
  // Fetch the list of all near expiry medicines
  const { data: nearExpiryData, refetch: refetchNearExpiry } = api.medicine.getNearExpiry.useQuery();
  // Fetch the list of all expired medicines
  const { data: expiredData, refetch: refetchExpired } = api.medicine.getExpired.useQuery();
  // Mutation to update notificationopen for low stock medicines
  const { mutate: updateLowStockNotificationOpen } = api.medicine.updateLowStockNotificationOpen.useMutation();
  // Mutation to update notificationopen for near expiry medicines
  const { mutate: updateNearExpiryNotificationOpen } = api.medicine.updateNearExpiryNotificationOpen.useMutation();
  // Mutation to update notificationopen for expired medicines
  const { mutate: updateExpiredNotificationOpen } = api.medicine.updateNearExpiryNotificationOpen.useMutation();

  useEffect(() => {
    if (lowStockCountData) {
      setLowStockCount(lowStockCountData.count);
    }
  }, [lowStockCountData]);
  useEffect(() => {
    if (nearExpiryCountData) {
      setNearExpiryCount(nearExpiryCountData.count);
    }
  }, [nearExpiryCountData]);
  useEffect(() => {
    if (expiredCountData) {
      setExpiredCount(expiredCountData.count);
    }
  }, [expiredCountData]);
  useEffect(() => {
    if (lowStockData) {
      setLowStockMedicines(lowStockData.medicines);
    }
  }, [lowStockData]);
  useEffect(() => {
    if (nearExpiryData) {
      setNearExpiryMedicines(nearExpiryData.medicines as NearExpiryMedicine[]);
    }
  }, [nearExpiryData]);
  useEffect(() => {
    if (expiredData) {
      setExpiredMedicines(expiredData.medicines as ExpiredMedicine[]);
    }
  }, [expiredData]);

  const handleLogout = () => {
    clearUsername();
    router.push("/sign-in");
  };

  const handleNotificationClick = () => {
    if (activeTab === 'lowStock') {
      updateLowStockNotificationOpen({ to: false });
    } else if (activeTab === 'nearExpiry') {
      updateNearExpiryNotificationOpen({ to: false });
    } else {
      updateExpiredNotificationOpen({ to: false });
    }
  };

  const handleNotificationBlur = () => {
    if (activeTab === 'lowStock') {
      updateLowStockNotificationOpen({ to: true });
      refetchLowStockCount();
    } else if (activeTab === 'nearExpiry') {
      updateNearExpiryNotificationOpen({ to: true });
      refetchNearExpiryCount();
    } else {
      updateExpiredNotificationOpen({ to: true });
      refetchExpiredCount();
    }
  };

  const totalNotificationCount = lowStockCount + nearExpiryCount + expiredCount;

  const formatExpiryDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-red-600' };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days`, color: 'text-red-500' };
    } else if (diffDays <= 60) {
      return { text: `${diffDays} days`, color: 'text-orange-500' };
    } else {
      return { text: `${diffDays} days`, color: 'text-yellow-500' };
    }
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
          open={showNotifications}
          onOpenChange={(open) => {
            setShowNotifications(open);
            if (open) {
              handleNotificationClick();
              refetchLowStock();
              refetchNearExpiry();
              refetchExpired();
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
              {totalNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {totalNotificationCount}
                </span>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 rounded-md border border-[#b0daef] bg-white text-[#156cbc] shadow-md"
          >
            <DropdownMenuLabel className="text-sm text-[#0fa7d1]">
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 text-center ${
                    activeTab === 'lowStock'
                      ? 'border-b-2 border-[#0fa7d1] font-semibold'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('lowStock')}
                >
                  Low Stock ({lowStockCount})
                </button>
                <button
                  className={`flex-1 py-2 text-center ${
                    activeTab === 'nearExpiry'
                      ? 'border-b-2 border-[#0fa7d1] font-semibold'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('nearExpiry')}
                >
                  Near Expiry ({nearExpiryCount})
                </button>
                <button
                  className={`flex-1 py-2 text-center ${
                    activeTab === 'expired'
                      ? 'border-b-2 border-[#0fa7d1] font-semibold'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('expired')}
                >
                  Expired ({expiredCount})
                </button>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeTab === 'lowStock' ? (
              lowStockMedicines.length > 0 ? (
                lowStockMedicines.map((medicine) => (
                  <DropdownMenuItem
                    key={`low-stock-${medicine.id}`}
                    className="cursor-pointer text-[#156cbc] hover:bg-[#0ca4d4] hover:text-white"
                  >
                    <div
                      className="flex items-center justify-between w-full"
                      onClick={() => router.push("/admin/medicine/list")}
                    >
                      <span className="flex-1 truncate mr-2">{medicine.name}</span>
                      <span className="text-xs text-red-500 whitespace-nowrap">
                        Stock: {medicine.stock}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="cursor-pointer text-[#156cbc] justify-center">
                  No low stock medicines
                </DropdownMenuItem>
              )
            ) : activeTab === 'nearExpiry' ? (
              nearExpiryMedicines.length > 0 ? (
                nearExpiryMedicines.map((medicine) => {
                  const expiryStatus = getExpiryStatus(medicine.expiryDate);
                  return (
                    <DropdownMenuItem
                      key={`near-expiry-${medicine.id}`}
                      className="cursor-pointer text-[#156cbc] hover:bg-[#0ca4d4] hover:text-white"
                    >
                      <div
                        className="flex items-center justify-between w-full"
                        onClick={() => router.push("/admin/medicine/list")}
                      >
                        <div className="flex-1">
                          <div className="truncate">{medicine.name}</div>
                          <div className="text-xs text-gray-500">
                            Expires: {formatExpiryDate(medicine.expiryDate)}
                          </div>
                        </div>
                        <span className={`text-xs font-medium whitespace-nowrap ml-2 ${expiryStatus.color}`}>
                          {expiryStatus.text}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              ) : (
                <DropdownMenuItem className="cursor-pointer text-[#156cbc] justify-center">
                  No near expiry medicines
                </DropdownMenuItem>
              )
            ) : (
              expiredMedicines.length > 0 ? (
                expiredMedicines.map((medicine) => (
                  <DropdownMenuItem
                    key={`expired-${medicine.id}`}
                    className="cursor-pointer text-[#156cbc] hover:bg-[#0ca4d4] hover:text-white"
                  >
                    <div
                      className="flex items-center justify-between w-full"
                      onClick={() => router.push("/admin/medicine/list")}
                    >
                      <div className="flex-1">
                        <div className="truncate">{medicine.name}</div>
                        <div className="text-xs text-gray-500">
                          Expired: {formatExpiryDate(medicine.expiryDate)}
                        </div>
                      </div>
                      <span className="text-xs font-medium whitespace-nowrap ml-2 text-red-600">
                        Expired
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="cursor-pointer text-[#156cbc] justify-center">
                  No expired medicines
                </DropdownMenuItem>
              )
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
