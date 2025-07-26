"use client";

import React, { useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import { Button } from "~/components/ui/button";
import { uploadImage } from "~/lib/upload/uploadImage";

const Page = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && (e.target.files[0] as any)) {
      setSelectedFile(e.target.files[0] as any);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a file first.",
      });
      return;
    }

    try {
      const url = await uploadImage(selectedFile);
      toast({
        title: "Upload Successful!",
        description: `File uploaded. URL: ${url}`,
      });
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your image.",
      });
    }
  };

  return (
    <div className="h-screen w-full space-y-4 p-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={!selectedFile}>
        Upload Image
      </Button>
    </div>
  );
};

export default Page;
