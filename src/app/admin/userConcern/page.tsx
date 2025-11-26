"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Eye } from "lucide-react";

const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: 0,
    }}
  >
    {children}
  </div>
);

const UserConcernPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "ALL" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED"
  >("ALL");
  const [activeTab, setActiveTab] = useState("active");
  const [skip, setSkip] = useState(0);
  const take = 10;
  const { data: activeData, refetch: refetchActive } =
    api.userConcern.getAll.useQuery({
      skip,
      take,
      search,
      status: status === "ALL" ? undefined : status,
    });
  const { data: archivedData, refetch: refetchArchived } =
    api.userConcern.getAll.useQuery({
      skip,
      take,
      search,
      status: "ARCHIVED",
    });
  const { mutate: updateStatus } = api.userConcern.updateStatus.useMutation({
    onSuccess: () => {
      refetchActive();
      refetchArchived();
    },
  });
  const { mutate: deleteConcern } = api.userConcern.delete.useMutation({
    onSuccess: () => {
      refetchArchived();
    },
  });

  const handleSearch = () => {
    setSkip(0);
    refetchActive();
    refetchArchived();
  };

  const handleStatusChange = (
    value: "ALL" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED",
  ) => {
    setStatus(value);
    setSkip(0);
    refetchActive();
  };

  const handlePrevious = () => {
    setSkip((prev) => Math.max(prev - take, 0));
  };

  const handleNext = () => {
    setSkip((prev) => prev + take);
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "IN_REVIEW":
        return "default";
      case "RESOLVED":
        return "outline";
      case "CLOSED":
        return "destructive";
      case "ARCHIVED":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = (
    id: number,
    newStatus: "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED" | "ARCHIVED",
  ) => {
    updateStatus({ id, status: newStatus });
  };

  const handleDelete = (id: number) => {
    deleteConcern({ id });
  };

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white p-6">
      <h1 className="mb-6 text-2xl font-bold">User Concerns</h1>
      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by subject or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="border-gray-300"
          />
        </div>
        <div className="flex items-end">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleSearch} className="border-gray-300">
            Search
          </Button>
        </div>
      </div>
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        {/* Active Tab */}
        <TabsContent value="active">
          <div className="rounded-md border border-gray-300">
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-300">
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeData?.data
                  ?.filter((concern) => concern.status !== "ARCHIVED")
                  .map((concern) => (
                    <TableRow key={concern.id} className="border-b-gray-200">
                      <TableCell>{concern.id}</TableCell>
                      <TableCell>{concern.user?.name}</TableCell>
                      <TableCell>{concern.subject}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-left"
                            >
                              <span className="flex items-center gap-1">
                                {truncateDescription(concern.description, 50)}
                                <Eye
                                  className={`h-3.5 w-3.5 text-gray-500 hover:text-gray-700 ${concern.description !== "" ? "" : "hidden"}`}
                                />
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white">
                            <VisuallyHidden>
                              <DialogTitle>Full Description</DialogTitle>
                            </VisuallyHidden>
                            <p className="py-2">{concern.description}</p>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={concern.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(
                              concern.id,
                              value as
                                | "PENDING"
                                | "IN_REVIEW"
                                | "RESOLVED"
                                | "ARCHIVED",
                            )
                          }
                        >
                          <SelectTrigger className="w-[150px] border-gray-300">
                            <SelectValue>
                              <Badge
                                variant={getBadgeVariant(concern.status)}
                                className={getStatusColor(concern.status)}
                              >
                                {concern.status}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_REVIEW">In Review</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(concern.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        {/* Archived Tab */}
        <TabsContent value="archived">
          <div className="rounded-md border border-gray-300">
            <Table>
              <TableHeader>
                <TableRow className="border-b-gray-300">
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedData?.data?.map((concern) => (
                  <TableRow key={concern.id} className="border-b-gray-200">
                    <TableCell>{concern.id}</TableCell>
                    <TableCell>{concern.user?.name}</TableCell>
                    <TableCell>{concern.subject}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-left"
                          >
                            <span className="flex items-center gap-1">
                              {truncateDescription(concern.description, 50)}
                              <Eye
                                className={`h-3.5 w-3.5 text-gray-500 hover:text-gray-700 ${concern.description == "" ? "" : "hidden"}`}
                              />
                            </span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <VisuallyHidden>
                            <DialogTitle>Full Description</DialogTitle>
                          </VisuallyHidden>
                          <p className="py-2">{concern.description}</p>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={concern.status}
                        onValueChange={(value) =>
                          handleUpdateStatus(
                            concern.id,
                            value as
                              | "PENDING"
                              | "IN_REVIEW"
                              | "RESOLVED"
                              | "ARCHIVED",
                          )
                        }
                      >
                        <SelectTrigger className="w-[150px] border-gray-300">
                          <SelectValue>
                            <Badge
                              variant={getBadgeVariant(concern.status)}
                              className={getStatusColor(concern.status)}
                            >
                              {concern.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(concern.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(concern.id)}
                        className="border-gray-300"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      <div className="mt-4 flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={skip === 0}
          className="border-gray-300"
        >
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            (activeTab === "active" && activeData?.data?.length !== take) ||
            (activeTab === "archived" && archivedData?.data?.length !== take)
          }
          className="border-gray-300"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default UserConcernPage;
