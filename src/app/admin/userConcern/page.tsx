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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

const UserConcernPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED">("ALL");
  const [skip, setSkip] = useState(0);
  const take = 10;

  const { data, refetch } = api.userConcern.getAll.useQuery({
    skip,
    take,
    search,
    status: status === "ALL" ? undefined : status,
  });

  // Use the new updateStatus mutation
  const { mutate: updateStatus } = api.userConcern.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSearch = () => {
    setSkip(0);
    refetch();
  };

  const handleStatusChange = (value: "ALL" | "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED") => {
    setStatus(value);
    setSkip(0);
    refetch();
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
      default:
        return "default";
    }
  };

  const handleUpdateStatus = (id: number, newStatus: "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED") => {
    updateStatus({ id, status: newStatus });
  };

  return (
    <div className="p-6 bg-white">
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
          />
        </div>
        <div className="flex items-end">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className=" bg-white">
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data?.map((concern) => (
              <TableRow key={concern.id}>
                <TableCell>{concern.id}</TableCell>
                <TableCell>{concern.user?.name}</TableCell>
                <TableCell>{concern.subject}</TableCell>
                <TableCell>{concern.description}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={concern.status}
                    onValueChange={(value) =>
                      handleUpdateStatus(concern.id, value as "PENDING" | "IN_REVIEW" | "RESOLVED" | "CLOSED")
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <Badge variant={getBadgeVariant(concern.status)}>
                          {concern.status}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className=" bg-white">
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
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
      <div className="mt-4 flex justify-between">
        <Button onClick={handlePrevious} disabled={skip === 0}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={data?.data?.length !== take}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default UserConcernPage;
