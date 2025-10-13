"use client";
import React from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../store/adminStore";

type LoginForm = {
  username: string;
  password: string;
};

const SignInPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const { toast } = useToast();
  const router = useRouter();
  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      console.log("DATA123", data);
      useAdminStore.getState().setUsername(data.username);
      toast({
        title: "Success!",
        description: "Succesfully Login",
        variant: "success",
      });
      router.push("/admin/dashboard");
    },
    onError: (data) => {
      toast({
        title: data.message,
        description: "invalid credentials",
        variant: "info",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        background: "linear-gradient(to bottom, #0ac2de, #0fa7d1, #156cbc)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <motion.h1
        className="mb-6 text-center text-3xl font-bold text-white drop-shadow-md sm:text-4xl lg:text-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        CAREMED: Barangay Health Access Portal
      </motion.h1>
      <motion.div
        className="w-full max-w-lg rounded-lg bg-white p-10 text-center shadow-xl"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.img
          src="logo.png"
          alt="MEDCARE Admin Logo"
          className="mb-6 rounded-2xl border-4 border-white object-contain shadow-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        />

        <motion.h2
          className="mb-6 text-3xl font-bold text-[#156cbc]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        ></motion.h2>
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div>
            <motion.input
              type="text"
              placeholder="Admin Username"
              className={`w-full rounded-md border p-3 focus:ring-2 focus:ring-[#0ac2de] focus:outline-none ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>
          <div>
            <motion.input
              type="password"
              placeholder="Password"
              className={`w-full rounded-md border p-3 focus:ring-2 focus:ring-[#0ac2de] focus:outline-none ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <motion.button
            type="submit"
            disabled={isSubmitting || loginMutation.isPending}
            className="cursor-pointer rounded-md bg-[#0fa7d1] p-3 text-lg font-semibold text-white transition-colors hover:bg-[#0ac2de] disabled:opacity-60"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSubmitting || loginMutation.isPending
              ? "Signing In..."
              : "Sign In"}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default SignInPage;
